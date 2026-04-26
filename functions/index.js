const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { getMessaging } = require("firebase-admin/messaging");

initializeApp();

const db = getFirestore();

/**
 * Triggered when a new message document is created in any chat.
 *
 * Firestore path: chats/{chatId}/messages/{messageId}
 *
 * This function:
 * 1. Reads the new message data (text, sender info)
 * 2. Reads the parent chat doc to find all participants
 * 3. For each participant who is NOT the sender, looks up their pushToken
 * 4. Sends an FCM notification to each recipient
 */
exports.sendNewMessageNotification = onDocumentCreated(
  "chats/{chatId}/messages/{messageId}",
  async (event) => {
    const messageData = event.data?.data();

    if (!messageData) {
      console.log("No message data found, skipping.");
      return;
    }

    const { chatId } = event.params;
    const senderEmail = messageData.user?._id || "";
    const senderName = messageData.user?.name || "Someone";

    // Build notification body
    let body;
    if (messageData.image) {
      body = "📷 Sent a photo";
    } else if (messageData.video) {
      body = "🎥 Sent a video";
    } else {
      body = messageData.text || "New message";
    }

    // Get chat document to find all participant emails
    const chatDoc = await db.collection("chats").doc(chatId).get();

    if (!chatDoc.exists) {
      console.log(`Chat ${chatId} does not exist, skipping.`);
      return;
    }

    const chatData = chatDoc.data();
    const chatName = chatData.groupName || senderName;

    // Collect all participant emails except the sender
    const recipientEmails = (chatData.userEmails || []).filter(
      (email) => email && email !== senderEmail
    );

    if (recipientEmails.length === 0) {
      console.log("No recipients found, skipping.");
      return;
    }

    // Fetch push tokens for all recipients
    const userDocs = await Promise.all(
      recipientEmails.map((email) =>
        db.collection("users").doc(email).get()
      )
    );

    const tokens = userDocs
      .filter((userDoc) => userDoc.exists && userDoc.data().pushToken)
      .map((userDoc) => userDoc.data().pushToken);

    if (tokens.length === 0) {
      console.log("No push tokens found for recipients, skipping.");
      return;
    }

    // Determine notification title
    const title = chatData.groupName
      ? `${senderName} in ${chatData.groupName}`
      : senderName;

    // Send FCM notification to each token
    const sendResults = await Promise.allSettled(
      tokens.map((token) =>
        getMessaging().send({
          token,
          notification: {
            title,
            body,
          },
          data: {
            chatId,
            chatName,
            type: "new_message",
          },
          android: {
            priority: "high",
            notification: {
              channelId: "messages",
              sound: "default",
              priority: "high",
            },
          },
          apns: {
            payload: {
              aps: {
                sound: "default",
                badge: 1,
              },
            },
          },
        })
      )
    );

    const succeeded = sendResults.filter((r) => r.status === "fulfilled").length;
    const failed = sendResults.filter((r) => r.status === "rejected").length;

    console.log(
      `Notification sent for chat ${chatId}: ${succeeded} delivered, ${failed} failed.`
    );

    // Clean up invalid tokens
    const invalidTokenPromises = [];
    sendResults.forEach((result, index) => {
      if (
        result.status === "rejected" &&
        result.reason?.code === "messaging/registration-token-not-registered"
      ) {
        const email = recipientEmails[index];
        if (email) {
          console.log(`Clearing invalid token for ${email}`);
          invalidTokenPromises.push(
            db.collection("users").doc(email).update({ pushToken: "" })
          );
        }
      }
    });

    if (invalidTokenPromises.length > 0) {
      await Promise.allSettled(invalidTokenPromises);
    }
  }
);
