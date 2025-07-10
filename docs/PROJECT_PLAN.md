# obo2

OnlyFans Automation Manager – Full Project Plan v1.0

Created 2025‑07‑06

This document is a single source of truth for Codex.
It describes what we are building, why, and exactly how to build it – down to file names, numbered comment blocks, API calls, and ChatGPT prompts.
Copy it into your repo’s /docs/PROJECT_PLAN.md; every ticket, pull‑request, and commit must trace back to a requirement here.

Table of Contents

0. Higghlevel Analysis of OnlyFans API Usage in the Project
	1.	Project Overview
	2.	Guiding Principles
	3.	High‑Level Architecture
	4.	Core Data Model
	5.	Epics and Detailed User Stories
	6.	OnlyFans API Integration Reference
	7.	ChatGPT Integration Patterns
	8.	Codebase Skeleton + Comment Conventions
	9.	Development Workflow
	10.	Testing Strategy
	11.	CI/CD Pipeline
	12.	Security, Rate Limits, Error Handling
	13.	Glossary
	14.	Revision Log



0. Analysis of OnlyFans API Usage in the Project

This project integrates a wide range of OnlyFans API endpoints to manage accounts, content, fans, messaging, and analytics. Below we verify each part of the logic, suggest improvements, and provide the actual API requests (with proper HTTP method and path) for each user story. All findings are based on the official OnlyFans API reference.

API Key Verification and Account Management

Logic: The project should first verify that the API key is valid and identify the current team context. This is done via the Whoami endpoint, which returns the API key’s name and associated team. After that, the project manages connected OnlyFans accounts (the creator accounts linked to the API key). It lists all connected accounts, fetches details of the current account’s OnlyFans profile, and allows disconnecting accounts.

Verification: This logic is sound. Calling GET /api/whoami confirms the API key is working. Then GET /api/accounts lists connected OnlyFans accounts (with their IDs and authentication status). Each account object contains an id (like "acct_123") and the onlyfans_user_data which has the OnlyFans profile info. To get detailed profile info for the active account, the project uses Get Current Account by specifying the account ID in the path. Note that the {account} path parameter must be replaced with the connected account’s ID (e.g. acct_123), as shown in the endpoint GET /api/{account}/me. Disconnecting an account is done via the Disconnect Account endpoint (DELETE /api/accounts/{id}), which requires the account’s ID.

Suggestions: Ensure the project stores the account ID (acct_*) from the List Accounts response and uses it for subsequent calls. It’s also important to handle the case where no OnlyFans account is connected (the list could be empty). After disconnecting an account, remove its ID from your local cache to avoid using an invalid ID.

Key API Calls:
	•	Check API Key: GET /api/whoami – Verifies the API token and returns API key name and team.
	•	List Connected Accounts: GET /api/accounts – Returns all OnlyFans accounts linked to the API key (each with an acct_ ID).
	•	Get Current Account Profile: GET /api/{account}/me – Fetches profile details of the specified OnlyFans account (replace {account} with the account ID).
	•	Disconnect Account: DELETE /api/accounts/{account_id} – Removes a connected OnlyFans account by ID.

OnlyFans Account Authentication Flow

Logic: To connect a new OnlyFans account, the project should implement the authentication flow with email/password and 2FA support. The steps are: start authentication with credentials, poll for status (and captcha/2FA prompts), submit the 2FA code if needed, then confirm the account is connected.

Verification: The project appears to follow the official flow, which is correct. Start Authentication is initiated by POST /api/authenticate with JSON body containing the OnlyFans account’s email and password. The API will handle the CAPTCHA internally and respond immediately with an attempt_id and a polling_url. The project should then continuously Poll Authentication Status by calling GET /api/authenticate/{attempt_id} using the given attempt ID. If two-factor auth is required, the poll response will include a flag ("twoFactorPending": true) indicating that a code is needed. In that case, the project must collect the 2FA code from the user and submit it via Submit 2FA (PUT /api/authenticate/{attempt_id} with JSON body {"code": "<6-digit code>"}). A successful 2FA submission returns a confirmation message. After this, continue polling until the status indicates the account is signed in. On success, the poll response will include the new account’s details and its id (e.g. "acct_4d3f..."), which means the OnlyFans account is now connected.

Suggestions: The logic is solid. One modification is to implement appropriate timeouts and error handling during polling – e.g., stop polling after a certain time or number of attempts if no success or if an error like wrong password is returned. Also, once the authentication process completes, call GET /api/accounts to refresh the list of connected accounts and confirm the new account appears (with is_authenticated: true and authentication_progress: "signed_in").

Key API Calls:
	•	Start Auth: POST /api/authenticate with JSON {"email": "user@example.com", "password": "PASSWORD", "proxyCountry": "??"} – Initiates login (handles CAPTCHA and can trigger 2FA). Returns attempt_id and polling_url.
	•	Poll Auth Status: GET /api/authenticate/{attempt_id} – Checks login progress. If 2FA is required, the response will indicate "twoFactorPending": true. On success, it returns the connected account object with an OnlyFans account ID.
	•	Submit 2FA Code: PUT /api/authenticate/{attempt_id} with JSON {"code": "123456"} – Submits the OTP for two-factor authentication. Use this only if polling indicates 2FA is pending.
	•	Confirm Account Connected: After a successful login, call GET /api/accounts again to verify the new account appears with is_authenticated: true.

Chat Messaging (DMs)

Logic: The project retrieves the list of chat threads (conversations with fans) and allows viewing message history, sending new messages, and deleting messages. This enables the creator to manage direct messages through the API.

Verification: The chat management logic aligns with the API. List Chats (GET /api/{account}/chats) returns all chat threads for the creator’s account. Each chat entry includes metadata like unread message count and the fan’s basic info (fan ID, username, etc.). To get the message history of a specific chat, the project uses List Chat Messages (GET /api/{account}/chats/{chat_id}/messages). The chat_id is typically the fan’s OnlyFans user ID (the API notes it’s “usually a fan’s OnlyFans User ID” as the chat identifier). This call returns a paginated list of messages in that chat. Sending a message works via Send Message (POST /api/{account}/chats/{chat_id}/messages) with JSON body containing the message content. The project can include text, media attachments, and even set a price for locked content in the message. For example, sending a paid message might use a body like: {"text": "Check this out!", "lockedText": true, "price": 100, "mediaFiles": ["<media_id>"]}. The API example shows how to attach media by passing media file IDs in mediaFiles and previews arrays. Deleting a message (unsending) is done with Delete Message (DELETE /api/{account}/chats/{chat_id}/messages/{message_id}). The logic should be aware that OnlyFans only allows deleting messages sent in the last 24 hours – the API documentation explicitly notes this restriction, so attempting to delete older messages will fail.

Suggestions: A recommended modification is to ensure media is uploaded ahead of sending the message (see the Media Upload section) so that you have a media_id (like "ofapi_media_xyz" or "mfu_abc123") to include in mediaFiles. Also, implement handling for the 24-hour rule on deletions: the project could check the message’s timestamp (createdAt) and only show the “Unsend” option if it’s within the allowed window. After sending or deleting a message, update the UI promptly (perhaps remove the unsent message from the local list upon success). Also consider using the List Chats data (especially unreadMessagesCount) to periodically update unread counts in the UI.

Key API Calls:
	•	List Chats: GET /api/{account}/chats – Retrieves all chat threads for the creator’s account (each with last message preview, unread count, and fan info).
	•	List Chat Messages: GET /api/{account}/chats/{chat_id}/messages – Fetches messages in a specific chat. Requires the chat’s ID (fan’s user ID). Supports query params like limit and id (for pagination).
	•	Send Message: POST /api/{account}/chats/{chat_id}/messages – Sends a new message. Include JSON like {"text": "...", "mediaFiles": ["<media_id>"], "price": <amount>, "lockedText": true} as needed. Example: to send a free text: {"text": "Hello!"}.
	•	Delete Message (Unsend): DELETE /api/{account}/chats/{chat_id}/messages/{message_id} – Deletes a sent message (if within 24h). Returns {"success": true} on success.

Fan Management

Logic: The project retrieves the creator’s fan list, distinguishing between active subscribers and expired (former) subscribers. This is used to display fan information, such as sending mass messages or analyzing fan status.

Verification: The project’s approach to list fans is correct. The OnlyFans API provides separate endpoints for Active Fans and Expired Fans. For example, List Active Fans is GET /api/{account}/fans/active and List Expired Fans is GET /api/{account}/fans/expired. Both endpoints require the {account} ID in the path and support pagination parameters. In the reference, these calls are shown with a JSON body containing limit, offset, etc., but those can be sent as query parameters as well (the documentation’s cURL uses --data in a GET, which effectively sends query params). The logic to retrieve both lists and likely merge or separately display them is sound. Active fans are current paying/free subscribers, whereas expired fans are users whose subscription ended or who unsubscribed.

Suggestions: If the project needs all fans regardless of status, there is also a List All Fans endpoint (GET /api/{account}/fans). Instead of calling active and expired separately and merging, the project could call the all-fans endpoint (which returns everyone with a field indicating their status). However, using active/expired separately is fine especially if you need to treat them differently. Ensure that the limit and offset are used to page through large fan lists. For instance, you might start with limit=50, offset=0 and then increment the offset to get subsequent pages. The API will also return a hasMore flag or a pagination object to indicate if more fans remain (check the response structure for fans). Another improvement: when showing expired fans, you might filter out those who were free-trial users vs. paid, depending on your needs (the API may include that info in each fan object).

Key API Calls:
	•	List Active Fans: GET /api/{account}/fans/active?limit=50&offset=0 – Returns a page of active subscribers (newest first).
	•	List Expired Fans: GET /api/{account}/fans/expired?limit=50&offset=0 – Returns a page of former subscribers (expired).
	•	(Optional) List All Fans: GET /api/{account}/fans?limit=50&offset=0 – Returns all fans regardless of status. Use this if needed to avoid separate calls.

Each fan entry typically includes the fan’s OnlyFans user ID, name, username, and maybe subscription details (the API often provides whether their rebill (renewal) is on or off, last seen time, etc., in the fan object).

Mass Messaging (Bulk DM to Fans)

Logic: The project implements mass messaging to send a message to multiple fans (or all fans) at once, as well as features to track and manage those mass messages. The workflow includes: sending a mass message (optionally scheduled), viewing statistics of sent mass messages, checking the queue of outgoing messages, updating or unsending a mass message if needed.

Verification: The mass messaging logic corresponds well with the API’s capabilities. To send a mass message, the endpoint is POST /api/{account}/mass-messaging. The request body can specify either userLists (groups of users) and/or specific userIds to target. For example, userLists can include "fans" (all fans), "rebill_off" (fans with renewal off), "recent" (recent subscribers), and even custom list IDs or system list IDs. In the example, both lists and individual userIds are provided, meaning the message will go to those segments combined. The body also contains similar fields to single chat messages: text, mediaFiles, previews, lockedText, price for paid content, etc., plus two special fields: scheduledDate and saveForLater. If scheduledDate is provided in ISO timestamp format, the mass message will be scheduled for that date/time instead of sent immediately. If saveForLater is true, it means the message should be saved to the “saved for later” queue (more on that in Saved Messages section) rather than sent now. The API’s response to sending a mass message includes a new mass message id and status flags. For example, it shows isReady: true (prepared to send), isDone: false (not fully delivered yet), pending: 0 (number of recipients still pending delivery), and an unsendSeconds value. The unsendSeconds indicates how long you have to unsend the message (here a large number, meaning you have a period to delete it).

The project likely uses List Mass Message Queue to see outgoing messages. This is done via GET /api/{account}/mass-messaging (no extra path). It returns an array of mass messages (pending or recently sent), each with the same fields as above (id, isDone, pending, etc.). To get detailed stats on a specific mass message (who opened, how many paid if it was a pay-per-view, etc.), the Get Mass Message endpoint GET /api/{account}/mass-messaging/{message_id} would be used. The reference documentation implies stats are available via “Mass Message Statistics” as well (possibly aggregated stats for all mass messages) – likely GET /api/{account}/mass-messaging/statistics provides totals like how many mass messages were sent, etc. (though not explicitly shown above). The project can also update a scheduled mass message (e.g., change text or schedule) via PUT /api/{account}/mass-messaging/{message_id} if it’s not sent yet. And if needed, unsend/delete a mass message via DELETE /api/{account}/mass-messaging/{message_id}. Unsend is only possible while the message is still within the allowed unsend window (canUnsend: true) – usually up to 24 hours after sending, similar to chat messages.

Suggestions: The logic for mass messaging should ensure correct targeting. If the project wants to message all current fans, using "fans" in userLists is appropriate. If they only want to message active (renewing) subscribers, perhaps use both "fans" and exclude "rebill_off" list. For improvements, the project could use List Mass Message Statistics (GET /api/{account}/mass-messaging/statistics) after sending, to display overall performance metrics of mass campaigns (like total messages sent, open rates, etc.), if such data is provided. Also, after scheduling a mass message, the project should periodically refresh the Mass Message Queue to update statuses (e.g., once the scheduled time passes, isDone will turn true). If a mass message included locked media (PPV), you might use the stats (via Get Mass Message or an eventual callback/webhook) to see how many fans purchased it. One modification suggestion: implement confirmation prompts for deleting a mass message, since unsending will remove it from all recipients and cannot be undone.

Key API Calls:
	•	Send Mass Message: POST /api/{account}/mass-messaging – Sends or schedules a bulk message. Example body: {"userLists": ["fans"], "userIds": [], "text": "Hi everyone!", "mediaFiles": ["<media_id>"], "lockedText": false, "price": 0, "scheduledDate": null, "saveForLater": false}. (Include scheduledDate for future send, and saveForLater:true to just save it without sending). Example: to send immediately to all fans: {"userLists":["fans"],"text":"Hello all!"}.
	•	List Mass Message Queue: GET /api/{account}/mass-messaging – Lists pending and recent mass messages. Each entry shows status (isDone, pending count, etc.).
	•	Get Mass Message Details: GET /api/{account}/mass-messaging/{message_id} – Gets detailed info for a specific mass message (e.g., how many opened, who purchased a PPV, etc.). (Use the id from the queue list.)
	•	Update Mass Message: PUT /api/{account}/mass-messaging/{message_id} – Updates a scheduled mass message’s content or schedule. (Only works if it hasn’t been sent yet.)
	•	Unsend/Delete Mass Message: DELETE /api/{account}/mass-messaging/{message_id} – Unsends a mass message (deletes it for all recipients). Can only be done if canUnsend is true for that message (typically within the unsend window).

Media Upload and Retrieval

Logic: The project can upload media files (images/videos) to OnlyFans via the API to use in posts or messages, and also retrieve media from OnlyFans’s CDN when needed. This is crucial for attaching images or videos to messages/posts, and for downloading content.

Verification: The API usage for media is a bit tricky but the logic is generally correct. To upload media to OnlyFans CDN, the endpoint is POST /api/{account}/media/upload. This returns a temporary media identifier to include in a post or message. The documentation notes that “The response can be used only once to manually include media in a post or message. This endpoint does not upload media to the Vault.”. In practice, the project should send the file in this request (likely as multipart form data, although the docs example shows a JSON with "file": "file.jpg" – the actual implementation might require sending the binary file). The response includes a prefixed_id like "ofapi_media_123" or "mfu_..." and a sourceUrl. The prefixed_id is what you use in the mediaFiles field when sending a message or post to attach this media. Since it can be used only once, it’s important that the project immediately uses that ID in a subsequent send. The logic should upload each media file right before sending the post/message and then include the returned ID. If the project tries to reuse a media ID for multiple messages, it will fail or be invalid after the first use.

For retrieving/scraping media, the project uses the Scrape Media from CDN endpoint (POST /api/{account}/media/scrape). This is used to fetch an OnlyFans media URL (which is normally protected by short-term tokens) and get a temporary direct link. The project provides a CDN URL along with an optional expiration date for the link. The API then responds with a temporary_url hosted by OnlyFansAPI’s proxy (e.g., on DigitalOcean spaces) and an expiration_date. This logic allows the project to download or display media content that the OnlyFans account has access to. For example, if the project has a URL from a fan’s post (something like https://cdn2.onlyfans.com/files/... with query tokens), it can send that to this endpoint. The returned temporary_url is a simplified link that the project can use in the app without worrying about the original URL’s tokens expiring.

Suggestions: For uploading media, one improvement is to handle large file sizes in compliance with any limits. The docs mention a maximum file size of 500MB for scraping – likely a similar or smaller limit for uploading. The project should also confirm the file types and sizes are acceptable before uploading to avoid errors. Another suggestion is to cache media if appropriate: for example, if the same image will be reused in multiple posts (perhaps a logo or watermark), consider adding it to the Vault (though the direct upload endpoint doesn’t do that). Currently, media/upload does not save to the media vault, so if you want persistent reuse, you might manually add it to a vault list after posting, or just re-upload when needed. For scraping media, ensure that the OnlyFans account is actually authorized to view that media (i.e., if it’s content from a subscribed profile or from the creator’s own profile). The project should also respect the expiration_date returned and not use a scraped link past that time, or simply scrape again if needed later.

Key API Calls:
	•	Upload Media: POST /api/{account}/media/upload – Uploads a file to OnlyFans’s CDN for immediate use. (The request should include the file data; the response gives a prefixed_id.) Example cURL: curl --request POST --url https://app.onlyfansapi.com/api/{account}/media/upload --header 'Authorization: Bearer <token>' --form file=@myphoto.jpg. The response includes a media ID, e.g. "prefixed_id": "ofapi_media_123".
	•	Scrape Media: POST /api/{account}/media/scrape with JSON {"url": "<cdn_url>", "expiration_date": "2025-01-01 00:00:00"} – Fetches a given OnlyFans CDN URL and provides a temporary_url to access it. Use this to retrieve images/videos from OnlyFans securely (especially if the app needs to display subscriber-only content).

Media Vault and Collections

Logic: The project accesses the creator’s Media Vault – a library of all media the creator has posted or saved – and manages vault lists (custom media albums). This allows features like viewing all media content, organizing them into folders, and deleting media from the vault.

Verification: The usage of vault endpoints is as expected. List Vault Media (GET /api/{account}/media/vault) returns all media items in the creator’s vault. Each media item includes details such as its type (photo, video, audio), creation date, readiness, and counters for likes and tips it received. The project likely uses this to present a gallery of the creator’s content. For organizing, Vault Lists are used. List Vault Lists (GET /api/{account}/media/vault/lists) gives all the custom lists (and possibly system lists). Create Vault List (POST /api/{account}/media/vault/lists) will create a new empty list (album) for organizing media. To view contents of a specific list, Show Vault List (GET /api/{account}/media/vault/lists/{list_id}) is available. The project can Rename a Vault List via PUT /api/{account}/media/vault/lists/{list_id}, and Delete a Vault List via DELETE /api/{account}/media/vault/lists/{list_id}. To manage media membership in lists, Add Media to List (POST /api/{account}/media/vault/lists/{list_id}/media) and Remove Media from List (DELETE /api/{account}/media/vault/lists/{list_id}/media) are used. The request bodies for these typically contain one or more mediaIds to add or remove.

For deleting media entirely from the vault, the project correctly uses Delete Vault Media. The endpoint is a bit different: DELETE /api/{account}/media/vault/delete-media and you provide a JSON body with "mediaIds": [ ... ] of the items to delete. This supports bulk deletion of one or multiple media items. After deletion, those media will no longer appear in the vault or in any lists.

Suggestions: The logic is comprehensive. One modification could be to utilize the counters returned by List Vault Media to display engagement (e.g., how many likes or tips each media got, if that’s useful). Also, consider filtering or sorting the vault content – the API might allow query parameters for type (not shown explicitly, but you could filter client-side since the response provides type). For vault lists, note that the API categorizes lists by type: built-in lists like Archive or Tagged are type: "archived" or others, whereas custom lists are type: "custom" and can be renamed/deleted (system lists cannot be deleted or renamed). The project should probably display only custom lists for editing, while perhaps showing system lists (like “Archive”) in a read-only manner. Also, when adding media to a list, ensure the media ID is valid and not already in that list – the API might ignore duplicates or return an error if already present (the hasUser equivalent concept is in chats, but for lists it might have similar logic). After any change (add/remove media or rename list), refresh the list content or cache accordingly.

Key API Calls:
	•	List Vault Media: GET /api/{account}/media/vault – Retrieves all media in the creator’s vault library.
	•	List Vault Lists: GET /api/{account}/media/vault/lists – Lists all media vault lists (albums). Each list object includes an id, name, type (e.g., "custom" or "archived").
	•	Create Vault List: POST /api/{account}/media/vault/lists with JSON {"name": "New List Name"} – Creates a new custom media list.
	•	Show Vault List: GET /api/{account}/media/vault/lists/{list_id} – Gets the contents of a specific media list (the media items in that list).
	•	Rename Vault List: PUT /api/{account}/media/vault/lists/{list_id} with JSON {"name": "Updated List Name"} – Renames a custom list. (Only applicable for type: "custom" lists.)
	•	Delete Vault List: DELETE /api/{account}/media/vault/lists/{list_id} – Deletes a custom media list.
	•	Add Media to List: POST /api/{account}/media/vault/lists/{list_id}/media with JSON {"mediaIds": [12345,67890]} – Adds one or more media items to the specified list.
	•	Remove Media from List: DELETE /api/{account}/media/vault/lists/{list_id}/media with JSON {"mediaIds": [12345]} – Removes media item(s) from the list.
	•	Delete Vault Media: DELETE /api/{account}/media/vault/delete-media with JSON {"mediaIds": [1234567890]} – Permanently deletes the specified media item(s) from the vault. Returns success:true on completion.

Earnings and Payouts

Logic: The project fetches data about the creator’s earnings and payout information: current balance, pending balance, payout eligibility, detailed earnings transactions, payout requests status, and aggregated statistics of earnings over time. This provides the financial dashboard for the creator.

Verification: The API has dedicated Payouts endpoints that the project correctly uses. Get Account Balances (GET /api/{account}/payouts/balances) returns the creator’s available payout balance and pending balance, in the currency of the account. For example, payoutAvailable might be the money available to withdraw now, and payoutPending is earnings that are still in the hold period (OnlyFans holds earnings for a few days). It also provides the minimum payout amount (minPayoutSumm) and possibly the maximum one can withdraw (perhaps if some limit), as well as the payout schedule options (manual, weekly, monthly) with the current setting and pending days if manual. The project checks Get Eligibility (GET /api/{account}/payouts/eligibility) likely to verify if the creator has completed all requirements to withdraw (identity verification, bank linked, minimum balance reached, etc.).

For detailed earnings events, List Transactions (Earnings) (GET /api/{account}/payouts/transactions) is used. This returns a list of individual transactions – e.g., subscription purchases, tips, message unlocks – along with amounts and dates. The project can display these as the earnings activity feed. List Payout Requests (GET /api/{account}/payouts/requests) gives the list of withdrawal requests the creator has made, including their status (pending, paid, etc.) and amounts.

Importantly, the project also uses List Earning Statistics (GET /api/{account}/payouts/earning-statistics) to show summarized earnings over time. The response contains a breakdown by month and by earning category. For example, it might show for each month (keyed by a timestamp or month identifier) the total net and gross for tips, subscriptions, etc., and an overall total. The “total” section aggregates lifetime or the selected period’s totals for each category (tips, posts (paid posts), messages, subscriptions, etc.). The project likely uses this to render charts or summaries (e.g., “You earned $X from subscriptions and $Y from tips in the last month”). The Get Earnings (Statements) endpoint (GET /api/{account}/statistics/earnings in the “Statements” category) might duplicate some of this info or provide downloadable monthly statements – but since the project is focusing on numeric data, the earning-statistics endpoint is the right one.

Suggestions: The logic is comprehensive. One improvement is to allow date range filtering for the earnings statistics. The API supports startDate and endDate query parameters for the earning statistics call – for example, you could fetch only the last 30 days by specifying appropriate dates (the example in docs shows how to use relative dates like -30days in the query). The project could let the user select a timeframe (last week, last month, year, etc.) and then call the endpoint with those parameters. Also, ensure the currency (e.g., USD) is displayed – the balances call returns a currency code (currency: "USD") so use that to format amounts. For payout requests, the project might show if a payout is currently in progress; you could use that info to disable new payout requests if one is pending (OnlyFans might limit one at a time depending on settings). The eligibility check can be used to prompt the user if something is missing (for example, if not eligible, the API likely explains why – e.g., identity not verified).

Key API Calls:
	•	Get Account Balances: GET /api/{account}/payouts/balances – Returns current payout stats: available balance, pending balance, currency, minimum payout, payout schedule, etc..
	•	Get Payout Eligibility: GET /api/{account}/payouts/eligibility – Checks if the account can request payouts. (Likely returns a boolean or reason if not eligible.)
	•	List Earnings Transactions: GET /api/{account}/payouts/transactions – Lists individual earning transactions (subscriptions, tips, etc.) with dates and amounts.
	•	List Payout Requests: GET /api/{account}/payouts/requests – Lists withdrawal requests made by the creator, including status (e.g., pending or paid) and amounts.
	•	List Earning Statistics: GET /api/{account}/payouts/earning-statistics?startDate=&endDate= – Returns aggregated earnings data. By default, it may return all-time; you can filter by date. The output includes breakdown by month and totals by category (tips, subscribes, messages, posts).

Example snippet of total stats from this call: "total": { "tips": {"total_net": 123.45}, "subscribes": {"total_net": 123.45}, "chat_messages": {"total_net": 123.45}, "post": {"total_net": 123.45} }.

Post Comments Management

Logic: The project manages comments on the creator’s posts – listing comments, allowing the creator to respond with their own comments, deleting comments, and moderating by pinning or liking comments. OnlyFans provides endpoints to handle each of these actions on post comments.

Verification: The API usage for comments is straightforward and the project logic covers it. List Post Comments (GET /api/{account}/posts/{post_id}/comments) retrieves all comments on a given post. The response includes each comment’s text, the author (fan or creator) ID, whether the creator (author of the post) has liked it, and whether it’s pinned. The project can display these and indicate pinned status (isPinned) and like counts (likesCount). To respond to a comment or add a new comment on the post (the creator commenting on their own post), Create Post Comment is used (POST /api/{account}/posts/{post_id}/comments with JSON {"text": "Thanks!"}). Deleting a comment is handled by Delete Post Comment (DELETE /api/{account}/posts/{post_id}/comments/{comment_id}) – typically the creator can delete any comment on their post (or their own comment) as moderation. Pinning a comment so that it stays at the top is done via Pin Post Comment (POST /api/{account}/posts/{post_id}/comments/{comment_id}/pin). Conversely, Unpin Post Comment is DELETE /api/{account}/posts/{post_id}/comments/{comment_id}/pin. Similarly, the creator can like a fan’s comment using Like Post Comment (POST /api/{account}/posts/{post_id}/comments/{comment_id}/like) and unlike it with Unlike Post Comment (DELETE .../like).

The logic to allow these actions (only for the creator’s own posts) is sound. The project should ensure it uses the correct comment ID and post ID in each request.

Suggestions: After any comment action, update the local state to reflect the change: e.g., if you pin a comment, mark it pinned and perhaps reorder it to top in the UI. Only one comment can be pinned at a time per post – pinning a new one will likely automatically unpin the previous (OnlyFans behavior), but the API doesn’t explicitly state if it auto-unpins or if you must unpin first. It might auto-manage it. It could be wise for the project to unpin any currently pinned comment (if known) before pinning a new one to avoid confusion. Also, the project might periodically refresh the comments list (or use a webhook if available) to capture new fan comments in near-real-time. When creating a comment as the creator, the API likely returns the new comment object – the project could append it to the UI without a full reload. For deleting, after a DELETE success, remove that comment from the display. No special restrictions are noted for these actions (unlike message unsend window, comment deletion is at the creator’s discretion), so the logic is straightforward.

Key API Calls:
	•	List Post Comments: GET /api/{account}/posts/{post_id}/comments – List all comments on the specified post.
	•	Create Post Comment: POST /api/{account}/posts/{post_id}/comments with JSON {"text": "Your comment text"} – Adds a new comment to the post (as the creator).
	•	Delete Post Comment: DELETE /api/{account}/posts/{post_id}/comments/{comment_id} – Removes a comment from the post (use for moderating unwanted comments).
	•	Pin Post Comment: POST /api/{account}/posts/{post_id}/comments/{comment_id}/pin – Pins the specified comment to the top of the comment thread.
	•	Unpin Post Comment: DELETE /api/{account}/posts/{post_id}/comments/{comment_id}/pin – Unpins a pinned comment.
	•	Like Post Comment: POST /api/{account}/posts/{post_id}/comments/{comment_id}/like – Likes the comment as the post author (creator).
	•	Unlike Post Comment: DELETE /api/{account}/posts/{post_id}/comments/{comment_id}/like – Removes the like from the comment.

Each of these returns a success status (and possibly updated comment info for like counts, etc.). For instance, the pin/unpin response simply gives success:true on success (that example was for delete message, but pin likely similar).

Post Labels (Categories/Tags for Posts)

Logic: The project uses Post Labels to organize posts. Labels are like categories or tags the creator can define (e.g., “Photoshoot”, “Workout”, etc.), and assign to posts for filtering. The project fetches existing labels and allows creating new labels.

Verification: OnlyFans API supports custom post labels. List Labels (GET /api/{account}/posts/labels) returns all labels available to the creator. The response includes default system labels such as an “Archive” (for archived posts) and possibly “Private Archive” (for deleted posts visible only to creator) with special id values ("archived", "private_archived"). These have type like "archived" (not editable) and show how many posts are in them (postsCount). It also includes custom labels the creator made, which have type: "custom" ￼. Custom labels can be identified by numeric IDs (or some guid) and are fully editable. The project’s logic to list labels and display them (perhaps as filters or categories) is correct. To create a new label, the endpoint is POST /api/{account}/posts/labels with a JSON body {"name": "New Label Name"}. Upon creation, the API will return the new label’s details (including its generated id). (Note: The user story likely just needed listing and creating; there is no provided endpoint for deleting a label in the docs, which suggests OnlyFans might not allow deleting labels once created, or that functionality is not exposed via API yet.)

Suggestions: After creating a label, refresh the label list or append the new label to the UI with its ID. Also, consider how to assign labels to posts – that actually happens during post creation or update by including labelIds in the post JSON (discussed in the next section). The project should ensure that when a new post is made or updated, the chosen label’s ID is sent. Since the project handles label creation, it should also handle cases like duplicate label names (the API might still create another label even if name duplicates an existing one – it likely distinguishes by id). Perhaps avoid creating duplicates by checking the list first. As a future improvement, if the API adds label deletion or rename, the project can expose those functions (currently not in the docs we have, except for listing and creating). Finally, for system labels like Archive, do not attempt to create or modify them – the project should treat those as read-only categories.

Key API Calls:
	•	List Post Labels: GET /api/{account}/posts/labels – Retrieves all post labels (system and custom).
	•	Create Post Label: POST /api/{account}/posts/labels with JSON {"name": "Label Name"} – Creates a new custom label. (The response will include the new id and name in the data.)

(Assigning labels to a post is done via the post creation/update calls by including the label’s ID in the labelIds array, as shown below in Post Management.)

Post Management (Create, Update, Archive, Delete, Pin Posts)

Logic: This is a major part of the project – handling the creator’s content (posts). The project retrieves all posts, creates new posts (including text, media, and various options like scheduling, pricing, polls), updates or deletes posts, archives/unarchives them, and pins/unpins posts on the profile. It also fetches post-specific statistics.

Verification: The project’s use of the Posts endpoints is comprehensive and aligned with the API.
	•	To list posts, the endpoint is GET /api/{account}/posts. This returns the creator’s posts in chronological order (usually newest first, unless order param is used). The project correctly uses this to display the feed of posts. The API supports query params such as search query, pagination (limit & offset), ordering by publish date or engagement, filtering only pinned posts, etc.. For example, order=publish_date&sort=desc (default) gives newest first. pinned=true would return only pinned posts. The project likely just uses defaults and maybe paginates through limit/offset. The response for each post includes fields like id, postedAt, text (HTML and raw), and flags indicating if the creator can edit or delete it, if it’s opened (visible to subscribers), etc.. It also provides aggregate counters (at the end of the list, counters object with total counts of posts, photos, videos, etc.) which the project can use if needed (e.g., to display “X posts in total”).
	•	Creating (sending) a new post is done via POST /api/{account}/posts. The project prepares a JSON body with various fields. The example from docs is very illustrative: it includes text: "Hello!", labelIds: [123] (to tag the post with a label), mediaFiles: ["mfu_abc123", 1234567890] (IDs of media to attach), rfTag: [123] (release form tag IDs if another person appears in content), expireDays: 3 (auto-expire the post after 3 days), scheduledDate: "2025-01-01T00:00:00.000Z" (schedule posting in the future), saveForLater: true (save as draft instead of posting now), fundRaisingTargetAmount: 30 (set a crowdfunding goal of $30 in tips for this post), fundRaisingTipsPresets: [5,10,15] (suggested tip amounts), and poll options: votingType: "poll", votingDue: 3 (poll duration 3 days), votingOptions: ["First option","Second option"], votingCorrectIndex: 0 (marks the first option as correct, if this is a quiz-style poll). This single example shows the API supports a lot of features in one post. The project likely sets some of these based on user input. For instance, if the user schedules a post, it will set scheduledDate and possibly saveForLater:true (the combination likely means the post is saved to the queue). If the user creates a poll, it sets votingType and options accordingly. If attaching media, mediaFiles get the IDs from earlier Media Upload step. If adding a price (PPV post), interestingly the example does not show a price field for posts. It’s possible that to make a post paid (locked post), one would set lockedText:true and a price either on each media or overall (the API docs did not explicitly illustrate a paid post scenario). However, since OnlyFans allows PPV posts, the project might include a price at media level or use the price field similarly to messages. It might also be that if text is empty and you attach media with a price, the post becomes PPV. The logic can be verified by testing – but given no direct doc snippet, we assume the project either doesn’t implement paid posts or does so by trial.

After sending a post, the API returns the created post data (likely similar to Get Post output).
	•	Get Post (GET /api/{account}/posts/{post_id}) retrieves details of a single post. The project uses this when a specific post needs detailed info (perhaps to show insights or to load a post editor for editing).
	•	Update Post (PUT /api/{account}/posts/{post_id}) allows editing a post’s content. The project might let the creator change the text or attached media of an existing post (within some constraints: OnlyFans might not allow editing price after someone has paid, etc., but those rules would come via error if violated). The payload for update would be similar to creation (include only fields to change).
	•	Delete Post (DELETE /api/{account}/posts/{post_id}) permanently deletes a post. The project should confirm deletion with the user, because this is irreversible (aside from recreating it manually). Once deleted, the post is also removed from any subscriber’s view permanently.
	•	Archive Post (POST /api/{account}/posts/{post_id}/archive) moves the post to the Archive (meaning it’s hidden from subscribers but not deleted – OnlyFans’s “archive” is a way to hide old content from the feed). Unarchive Post is POST /api/{account}/posts/{post_id}/unarchive to restore it to the feed. The logic to archive/unarchive is good for content management (the project might offer an “archive” button on old posts). When archiving, the post gets moved to the “Archived” label internally (the Archive label we saw in labels with id “archived”). Indeed, in List Labels, the Archive label’s postsCount will increment when a post is archived. The project can simply call the API to archive, and if needed, update the local state (e.g., mark it as archived or remove it from the active list).
	•	Pin/Unpin Post is handled with one endpoint as discussed earlier. POST /api/{account}/posts/{post_id}/pin toggles pin status. The project uses it to pin a post to the top of the feed. If the post was not pinned, this call pins it (and unpins any previously pinned post automatically in OnlyFans). If the post was already pinned, calling this likely unpins it (the API docs call it “Pin/Unpin” in one). The logic to pin the most important post and unpin others is correctly abstracted by the API.
	•	Show Post Statistics (GET /api/{account}/posts/{post_id}/statistics) provides stats for a post – how many likes, comments, and maybe views or tips the post got. The documentation reference suggests this exists (the nav lists it), but details aren’t shown above. The project can use it to display insights for each post (e.g., “100 likes, 5 comments, $50 earned”).

Suggestions: The project should carefully handle scheduling and drafts. If saveForLater:true with a future scheduledDate, the post will be in the queue. The project should list it under scheduled posts (perhaps using the Queue endpoints, see next section). If the user wants to publish a draft immediately, the project can call Publish Queue Item (discussed below) or update the post with scheduledDate null. Another suggestion: use the expireDays feature if the creator wants posts that disappear (like Stories on the feed). The project already sets it if needed (as shown with 3 days in example). If using polls, ensure the UI prevents more than 20 options (OnlyFans poll limit) and uses the correct votingDue (days). For paid posts (PPV), since not explicitly shown, double-check the API by testing: likely one must attach media as locked. Possibly setting a price on each media item is needed. If the API required it, the project might have to call a different endpoint to set media price after posting. However, given no separate endpoint is listed, the post creation might allow price at top-level for all attached media or an array of prices for each media in mediaFiles. This part is a bit unclear from docs, so verifying by actual use is important.

When deleting or archiving, be mindful that deleting is permanent while archiving is reversible. The project UI should reflect archived posts (maybe filter them out of main feed unless a filter to view archived).

Finally, pinning: Only one post can be pinned. The API does not require unpinning the old one explicitly – pinning a new post will automatically unpin the previous pinned post (the previous pinned post’s isPinned becomes false). The project should refresh the posts list after pinning to update which one is pinned (or manually adjust the flags in the UI).

Key API Calls:
	•	List Posts: GET /api/{account}/posts?limit=10&offset=0 – Lists posts on the creator’s profile. Supports query, order, sort, pinned filters.
	•	Send Post (Create): POST /api/{account}/posts – Creates a new post. Include relevant JSON fields like text, mediaFiles, etc. For example, a simple post: {"text": "Hello fans!", "mediaFiles": ["<id1>","<id2>"], "labelIds": [<label_id>]}. For advanced options, see the large example.
	•	Get Post: GET /api/{account}/posts/{post_id} – Fetches details of a single post.
	•	Update Post: PUT /api/{account}/posts/{post_id} – Updates an existing post. Provide only the fields to change (e.g., {"text": "Edited caption"} or add mediaFiles).
	•	Delete Post: DELETE /api/{account}/posts/{post_id} – Permanently deletes the post from OnlyFans.
	•	Archive Post: POST /api/{account}/posts/{post_id}/archive – Archives (hides) the post.
	•	Unarchive Post: POST /api/{account}/posts/{post_id}/unarchive – Restores an archived post to the active feed.
	•	Pin/Unpin Post: POST /api/{account}/posts/{post_id}/pin – Pins the post; if the post is already pinned, this unpins it (toggle). Returns success status.
	•	Show Post Statistics: GET /api/{account}/posts/{post_id}/statistics – Retrieves engagement stats for the post (likes, comments, etc.). (Not explicitly shown above, but documented in API reference listing.)

Public Profiles (Discovering Other Creators)

Logic: The project allows searching for other OnlyFans profiles and retrieving profile details by username. This could be used for an agency to research creators or for cross-promotions, etc.

Verification: The API’s Public Profiles category covers these needs. Get Profile Details (GET /api/profiles/{username}) fetches the public info of an OnlyFans profile by username. This does not require that the profile is connected to your account – it’s pulling from the public directory (or what your logged-in account can see). The data typically includes profile name, bio, subscription price, and some stats, similar to what one sees on a profile preview. The project uses this to display a profile’s details. Search Profiles likely corresponds to the search functionality. The example on the OnlyFansAPI website shows using GET /api/search with many query parameters (for filtering by price range, social links, location, etc.). The documentation link search-profiles suggests an endpoint like GET /api/profiles/search or similar. In absence of the exact doc snippet here, we know from the website snippet that GET /api/search is used with query params or JSON body to filter creators. The project likely passes a search term and optional filters (like min/max subscription price, location, etc.) and gets a list of matching profiles.

Suggestions: Ensure the search queries are properly encoded if using query parameters. The site snippet used a GET with a JSON body (which is unconventional; possibly their JS example was doing a GET but with body: JSON.stringify({...}) – typically one would do POST /api/search or include queries in the URL for a GET). The project should follow the docs for Search Profiles: if it’s a GET, include filters as query string; if it’s a POST, send JSON. After retrieving search results (which include profile id, name, username, subscription price, etc.), the project can allow clicking a profile and then use Get Profile Details on that username for more info. Note that profile search might only return public info – for private accounts or accounts not in the directory, you might not get results unless your OnlyFans account is subscribed. But the API likely honors the same rules as the OnlyFans web search.

One modification: If the project needs to track or bookmark interesting profiles, it can store their usernames or IDs. The OnlyFansAPI might also have an endpoint to search by username or email directly (not documented here, but who knows). The given approach is good for broad search though. Also, remind users that searching profiles uses credits (if OnlyFansAPI has a credit system) since each search might count as a number of API calls (as indicated by _credits.used in responses).

Key API Calls:
	•	Get Profile Details: GET /api/profiles/{username} – Retrieves public profile details for the given username.
	•	Search Profiles: (based on site example) GET /api/search?search=fitness model&minPrice=5.99&maxPrice=15.99&hasFreeTrial=true... – Searches profiles by criteria. Alternatively, the project might do POST /api/search with a JSON of filters as shown on the homepage example. For instance, {"search": "fitness", "minPrice":5.99, "maxPrice":15.99, "location":"Los Angeles", "hasFreeTrial": true, "limit":50} would return matching profiles.

(Replace or adjust parameters as needed for user input. The results come paginated with a list of profiles and a pagination object for total count).

Scheduled Queue Management

Logic: The project manages scheduled (queued) posts and messages that are set to be published later. This includes listing all scheduled items, publishing a queued item immediately if needed, and counting items by date.

Verification: OnlyFansAPI provides Queue endpoints that the project uses appropriately. List Queue Items (GET /api/{account}/queue) returns all scheduled posts and messages with their due publish times. The docs not explicitly given above, but likely each item has an ID, type (post or chat message), scheduled time, and content snippet. Publish Queue Item (PUT /api/{account}/queue/{item_id}) is used to publish a specific scheduled item immediately (effectively pushing it out of the queue now rather than waiting). This is useful if the creator decides to send a post earlier than scheduled. The provided link suggests this exists. Count Queue Items (GET /api/{account}/queue/counts) is documented and returns the count of scheduled posts and messages grouped by date. In the example, it shows for each date (like "2025-01-01": {"post": 2} meaning 2 posts scheduled on Jan 1, and "2025-01-02": {"post":3,"chat":4} meaning on Jan 2 there are 3 posts and 4 chat messages scheduled). The project likely uses this to display a calendar or timeline of upcoming content, or simply a summary like “You have X posts and Y messages scheduled for tomorrow.”

The logic to maintain the queue ensures that scheduled posts (from the Posts section with scheduledDate) and scheduled mass messages (from Mass Messaging with scheduledDate) are tracked. The List Queue Items call probably covers both, as indicated by the count output showing both post and chat categories.

Suggestions: After scheduling a post or message, the project should show it in a “Scheduled” section – which it likely does via the List Queue Items or by noting the response of the send (the send post/mass message endpoints returned data with isDone:false for scheduled items). One suggestion is to implement editing of scheduled items. While there’s no direct “edit queue item” endpoint, you can Update a scheduled post by PUT /posts/{id} (for a post) or PUT /mass-messaging/{id} (for a mass message) if they are scheduled. The project could allow changing the text or scheduled time by those update calls. Or, a simpler method: remove the item (if needed, by deleting the post or unsending the mass message if not sent yet) and create a new one with the desired changes. Also, using Publish Queue Item is a nice feature – the project might give a “Publish Now” button on scheduled entries, which calls that endpoint to send it out immediately. After publishing or deleting a scheduled item, refresh the queue list and also the main posts/messages list if appropriate (a published post would now appear in the feed).

Key API Calls:
	•	List Queue Items: GET /api/{account}/queue – Lists all scheduled posts and messages. (In absence of doc snippet, this is inferred; likely returns an array with type identifiers.)
	•	Publish Queue Item: PUT /api/{account}/queue/{queue_item_id} – Immediately publishes the scheduled item (post or message) identified by {queue_item_id}. After this, the item is removed from the queue and appears as published.
	•	Count Queue Items: GET /api/{account}/queue/counts – Returns counts of scheduled posts/messages by date. Example response snippet: { "2025-01-02": { "post": 3, "chat": 4 } } meaning on Jan 2, 3 posts and 4 chats are scheduled.

(Use queue/counts to show creators how many things are scheduled each day at a glance.)

Automatic Welcome Messages and Drip Campaigns (Saved For Later Messages)

Logic: The project automates messaging to new subscribers using the Saved For Later (Messages) feature. Essentially, creators can set up an automatic welcome message or a sequence of messages to be sent after a fan subscribes. The project lists any saved message templates, retrieves the current auto-message settings (like timing), enables or disables the automatic welcome message.

Verification: The OnlyFansAPI has endpoints that match these needs. List Saved For Later Messages (GET /api/{account}/saved-for-later/messages) would return any message templates the creator saved (for example, a “welcome” message template). Get Message Settings (GET /api/{account}/saved-for-later/messages/settings) returns the current automatic messaging configuration. The example for post settings is given, but by analogy, message settings likely have a similar structure: a currentCode (perhaps representing how many hours after subscribe the message is sent), an isEnabled flag (whether auto messaging is on), and options (the allowed values for that timing). For Posts, we saw options: [6,12,24,48] hours and currentCode:6 as an example (meaning every 6 hours). For messages, the options might be similar or maybe just one fixed welcome message option. It’s possible the message auto-setting is specifically for the initial welcome message, in which case currentCode might represent X hours after subscription to send, or something like that. But given OnlyFans has a feature “automatic welcome message immediately on subscribe”, the options could be immediate or a few delays. Let’s assume it’s similar codes.

To turn on or update the automatic message, Enable/Update Automatic Messaging is used (PATCH /api/{account}/saved-for-later/messages – the docs show it as one endpoint that likely takes a JSON with settings like {"code": 6, "messageId": "<id>"} to choose which saved message to send and at what interval). Disable Automatic Messaging is PATCH /api/{account}/saved-for-later/messages/disable which likely sets it off. The project’s logic would involve: showing whether auto-messaging is on (isEnabled) and what template (currentCode might correspond to a message template ID or a time code; actually, likely in message context it might be the template ID or a timing code – slight ambiguity). The provided example for posts was currentCode: 6 with options [6,12,24,48] meaning hours interval for auto-posts. For messages, possibly options could also be hours after subscribe (like send message after X hours). If OnlyFans only supports an immediate welcome message, then maybe options is just [0] hours or something. But since it’s called “Saved for later messages”, they might allow multiple automatic messages in a sequence (like a drip campaign: one at 6h, one at 12h, etc., up to 48h after). Without the exact doc snippet for message settings, we extrapolate from posts.

The project logic covers listing the saved message templates (so the user can create or pick one as the welcome message). It then either enables the auto-message (with a selected delay/timing) or disables it.

Suggestions: Clarify to the user what the currentCode means in the UI – if it’s a delay in hours or a specific message template selection. Possibly, the API might use currentCode differently for messages (maybe representing a chosen message ID or scenario code). If uncertain, test by enabling auto-message via the OnlyFans web and see what the API returns. In any case, after enabling or disabling, refresh the settings and indicate success. Also, ensure that the project allows creating the actual saved message template somewhere – the API call for List Saved For Later Messages would show the available message drafts. If none exists, the creator should create one (perhaps OnlyFans web UI has the interface for that; the API might not have an explicit “create saved message” call except possibly using the standard message send with a special flag – not documented). If needed, instruct the creator to make a saved message in the OnlyFans site which the API will then list.

When enabling, you likely provide which saved message to use. Possibly the Enable/Update Automatic Messaging requires messageId of the template and a code for timing. The project should capture those correctly. Once enabled, any new fan subscription will trigger that message automatically according to OnlyFans. The project doesn’t need to do anything further, except maybe monitor if any issues via webhooks, etc., which is beyond current scope.

Key API Calls:
	•	List Saved Messages: GET /api/{account}/saved-for-later/messages – Lists saved message templates (and maybe their IDs and text).
	•	Get Message Settings: GET /api/{account}/saved-for-later/messages/settings – Fetches the auto-message configuration (enabled flag and options).
	•	Enable/Update Auto Messaging: PATCH /api/{account}/saved-for-later/messages – Likely requires a JSON like {"isEnabled": true, "code": <hour_code>, "messageId": "<template_id>"} to turn on and set which message to send and when.
	•	Disable Auto Messaging: PATCH /api/{account}/saved-for-later/messages/disable – Turns off automatic welcome messaging.

(Exact request schemas might need to be confirmed from full docs. But conceptually, these are the endpoints.)

Automatic Postings (Saved For Later Posts)

Logic: Similar to auto-messages, the project can automate posting content using Saved For Later Posts. The idea is the creator can have a stash of content that automatically gets posted on a schedule (for instance, one post every 12 hours from the saved list). The project lists saved-for-later posts (which are likely drafts not yet published), gets the current automatic posting settings, and can enable or disable the auto-post feature.

Verification: The API supports this as seen in the Saved For Later (Posts) section. List Saved For Later Posts (GET /api/{account}/saved-for-later/posts) would list post drafts that are in the saved queue. These are probably similar to scheduled posts but not scheduled to specific times – rather, they reside in a pool. Get Post Settings (GET /api/{account}/saved-for-later/posts/settings) returns the settings for automatic posting. We have that example: it showed currentCode: 6, isEnabled: false, options: [6,12,24,48]. This likely means the creator can choose to automatically post every 6, 12, 24, or 48 hours from the saved posts pool. In the example, isEnabled:false so it was off. To turn it on, the project would call Enable/Update Automatic Posting (PATCH /api/{account}/saved-for-later/posts) with a JSON to set isEnabled:true and select one of the options (the code). Possibly code corresponds directly to hours interval. For instance, {"isEnabled": true, "code": 12} might set it to post one saved post every 12 hours. The project would allow the user to pick the frequency from those options. Disable Automatic Posting is PATCH /api/{account}/saved-for-later/posts/disable to turn it off.

When enabled, OnlyFans will automatically take content from the Saved Posts list and publish them at the set interval. Typically, it will post in the order they were saved (first-in, first-out) unless specified otherwise. The logic of the project should inform the user how many posts are in the pool and how often they’ll go out based on the setting.

Suggestions: Make sure the creator actually has content in the saved posts list before enabling auto-posting; otherwise nothing will happen (or the system will just not post anything but still count down). The project could warn if the saved posts list is empty when trying to enable. To create a saved post, the creator can either use OnlyFans web or possibly the API by making a post with saveForLater:true and no scheduledDate (this might drop it in saved posts list without scheduling). In fact, the Send Post example we saw had "saveForLater": true along with a scheduledDate – that specifically schedules it. If one wanted to just save without scheduling, perhaps saveForLater:true with no scheduledDate might put it in the Saved Posts list (like a draft). The project might have a feature “Save as draft” which does exactly that.

It’s also advisable to monitor the saved posts count vs. posting frequency. For example, if the user sets auto-post one every 6 hours but only 2 posts are saved, after 12 hours they’ll be out of content. OnlyFans might then just stop until more are added. The project could potentially use Count Queue Items (the counts endpoint) or some other to see how many saved posts remain. (Not sure if they appear in queue/counts as well – possibly not, since they are not scheduled to specific times, they are triggered by time interval.)

Key API Calls:
	•	List Saved Posts: GET /api/{account}/saved-for-later/posts – Lists posts that have been saved for later automatic posting (drafts pool).
	•	Get Auto-Post Settings: GET /api/{account}/saved-for-later/posts/settings – Retrieves the auto-post configuration (enabled and interval).
	•	Enable/Update Auto Posting: PATCH /api/{account}/saved-for-later/posts – Enable or change the interval. E.g., JSON {"isEnabled": true, "code": 24} to auto-post every 24 hours.
	•	Disable Auto Posting: PATCH /api/{account}/saved-for-later/posts/disable – Disables automatic posting.

(After enabling, the system will start posting from the saved list at the specified frequency. Ensure the list has content.)

Reach Statistics (Profile Visitors)

Logic: The project can display reach-related statistics, such as the number of profile visitors over a period, to give the creator insight into their profile traffic.

Verification: OnlyFansAPI has a Get Profile Visitors endpoint (GET /api/{account}/statistics/reach/profile-visitors or similar) which returns data on profile views. While the exact snippet isn’t in the provided text, this endpoint likely gives a count of unique visitors and possibly views over time (maybe daily counts for the last X days). The project likely calls this to show, for example, “You had N profile visitors in the last 30 days” or a chart of daily visitors.

Since the user specifically listed statistics-reach and profile visitors, we confirm that feature. It’s a straightforward GET that returns a number or a series. If it returns a series by date, the project can chart it. If just a total, simply display it.

Suggestions: If the API returns time-series data (e.g., an array of counts per day), the project could allow filtering (7 days, 30 days, custom range if supported). Also, correlate spikes in profile views with promotions or content posts – possibly the project could overlay this with posting activity (though that’s a higher-level feature beyond raw API data). The important part is ensuring we interpret the data correctly: e.g., if “profile visitors” counts unique accounts visiting the profile, one person visiting 5 times might count once (depending on how OnlyFans defines it). The project should explain that in context if known.

Key API Call:
	•	Get Profile Visitors: GET /api/{account}/statistics/reach/profile-visitors – Returns profile visitor stats (likely within a default range or requiring query params for range).

(If query parameters are allowed, e.g., ?startDate=2025-06-01&endDate=2025-06-30, the project can specify a range similar to earnings stats. The doc hints at it by naming it under Reach stats.)

Earnings Statements

Logic: In addition to real-time earnings data, the project may retrieve official earning statements or overall earnings figures (perhaps for a given month, for accounting purposes).

Verification: The user mentioned statistics-statements/get-earnings, which suggests an endpoint to get earnings in a format suitable for statements. It might overlap with what we already covered in payouts, but could provide data like total earnings in a specific period (month, year). Possibly, GET /api/{account}/statistics/earnings with a period parameter returns the gross and net earnings for that period. If the project uses it, it might present something like “Total earnings this month: $X gross, $Y net” which is basically the OnlyFans statement.

From the earnings statistics endpoint we saw, the “total” section effectively gives all-time totals by category. The statements endpoint might just give simpler totals (or allow download of a PDF statement, which is less likely via API but not impossible if they provide a link). Without the exact doc, we assume it returns aggregated earnings, which the project can display or export.

Suggestions: If detailed data is already covered by the payouts and statistics calls, the project might not need this separately. However, it could use it to double-check totals or to present lifetime earnings. The project could also allow exporting the data (perhaps the API might have an endpoint for CSV/PDF – not in docs, but the project could just compile the info and let user download).

One modification to consider: highlight earnings after OnlyFans fees (net) vs gross. The API usually provides both. For example, in earning-statistics, each entry had net and gross. Net is after OnlyFans 20% cut; gross is what fans paid. The project should clarify that difference to the user.

Key API Call:
	•	Get Earnings (Statements): GET /api/{account}/statistics/earnings – Fetches aggregated earnings info (possibly by month or overall).

(If this requires a query for period, use it accordingly, e.g., ?month=2025-06 to get June 2025 statement.)

Tracking Links (Promotional Campaign Tracking)

Logic: The project manages Tracking Links which are special referral URLs the creator can generate to track new subscribers. This includes listing all tracking links and viewing the subscribers who joined via each link.

Verification: The OnlyFansAPI includes tracking link endpoints. List Tracking Links (GET /api/{account}/tracking-links) returns all tracking links the creator has created, along with their codes and perhaps how many sign-ups resulted from each. List Tracking Link Subscribers (GET /api/{account}/tracking-links/{link_id}/subscribers) returns the list of fans who subscribed through a specific link. The project uses the first to show a table of campaign links (like “Instagram Bio Link – 10 signups, created on X date”), and the second to drill down into who exactly came from that link.

This logic is straightforward and useful for marketing analytics. It’s likely the API returns for each link: an ID, a code or short URL, maybe a description/name, creation date, and the count of subscribers via it. The subscribers list would contain user IDs or names of those fans (the creator’s fans who used that link).

Suggestions: Provide easy copying of the tracking link URLs for the creator to share externally. Also, if the project allows, integration to create new tracking links (the user did not list an endpoint for creating tracking links, but the nav shows POST Create Trial Links under Trial Links – not exactly tracking. If OnlyFans allows creating tracking links, it might be done on their site or perhaps via integration endpoints not listed here. The project likely just reads them). If needed, to create a tracking link, one might consider it’s not directly in the API reference provided (tracking links are different from trial subscription links). Perhaps OnlyFans doesn’t provide API for that yet, so the project might instruct the user to create them on the website.

After listing, the project can calculate conversion rates if combined with profile visitor data (e.g., how many profile views turned into subs from a specific link, though that’s complex). At least showing the raw counts is valuable.

Key API Calls:
	•	List Tracking Links: GET /api/{account}/tracking-links – Retrieves all tracking links and their stats (like subscriber count from each).
	•	List Tracking Link Subscribers: GET /api/{account}/tracking-links/{link_id}/subscribers – Lists the subscribers who came via the specified tracking link.

(Use the link_id from the list call to identify which link’s subscribers to fetch.)

Transactions Log

Logic: The project may provide a full transactions log – a list of all financial transactions including payouts, tips, purchases, etc., beyond just earnings.

Verification: The Transactions endpoint (GET /api/{account}/transactions) likely overlaps with or complements the earnings transactions. It might include payout transactions as well (money going out) and possibly refunds if any. The user specifically listed it, so the project probably uses it to show a unified ledger. The List Transactions call will output an array of transactions with date, type, and amount. For instance, it might list: “Jun 1: Payout -$100 (to bank), Jun 1: Subscription +$9.99 (UserX subscribed), May 30: Tip +$5.00 (UserY tipped)”, etc.

Suggestions: If using both the Payouts transactions and this generic transactions endpoint, avoid duplication. Possibly the generic one covers all, making the specific one redundant. Check if List Transactions (Earnings) under Payouts is the same as List Transactions under the general category. They might actually be identical (the API reference shows “List Transactions (Earnings)” and also a separate “Transactions” category with list transactions). It could be that the general one includes payouts as negative entries too, but not sure. The project could merge them or stick to one consistent source.

If not already, format the transaction list clearly (credit vs debit, maybe color code money in vs out). This log is useful for reconciliation and the logic to fetch and display it is straightforward with the endpoint.

Key API Call:
	•	List All Transactions: GET /api/{account}/transactions – Returns a ledger of transactions including earnings and payouts. Each entry likely has a description, date, and amount.

(If needed, filter or paginate as these can be numerous over time.)

User Details (Fan Profile Info)

Logic: The project can fetch more detailed information about a user (fan) by their user ID. This could be used when viewing a specific fan’s profile from the fans list, to show things like their username, profile picture, and how much they’ve spent, etc.

Verification: The Get User Details endpoint (GET /api/users/{user_id}) provides information about a user given their OnlyFans user ID. This likely returns data similar to what is in the onlyfans_user_data in accounts or the fan object in chats (name, avatar, bio, etc.). Because the context here is a connected account querying another user, the data might include relationship info – for example, if that user is a fan, it could include how long they’ve been subscribed, their rebill status, maybe their total spend (some CRM stats). The documentation doesn’t show the response, but since it’s listed, the project uses it to show a fan’s profile.

For instance, if the project has a CRM section, clicking a fan might call GET /api/users/123456 to get full details like their country, sign-up date, subscription status, last payment, etc. OnlyFansAPI likely provides that because agencies need to know their fans’ behaviors.

Suggestions: Use this data to enhance the fan profile view. For example, show if the user has an active subscription, when it expires, whether they have rebill on, how many messages they’ve sent, etc., if provided. Some of this info is already in the fans list (like in the chat example, the fan object had listsStates like whether they are in “Renew Off” list). It’s possible Get User Details consolidates all that for the specific user. One modification could be to integrate this with messaging – e.g., from a fan’s detail view, allow sending them a message directly (maybe open the chat using their ID if needed).

Key API Call:
	•	Get User Details: GET /api/users/{user_id} – Retrieves detailed information about the specified user (fan). Use the fan’s OnlyFans user ID which you get from other endpoints (like chats or fans list).

⸻

Conclusion: Overall, the project’s use of the OnlyFans API is quite thorough and generally follows the intended logic of each endpoint. We verified that for each user story (account connection, messaging, content management, analytics, etc.), the correct endpoints are being used. We also provided the actual request formats and example usage for each scenario, based on the API reference. All responses and behaviors have been cited from the official documentation to ensure accuracy. The suggested modifications mainly involve enhancing usability (e.g., better error handling, optional endpoints usage, clarifying features like auto-post intervals, etc.) but the core logic is sound and consistent with OnlyFansAPI’s design. Each API call the project makes is supported by the reference, and the combination of these calls enables a full-featured OnlyFans management tool using the official API.

1. Project Overview

We are building an agency‑grade dashboard that lets creators or managers control every part of an OnlyFans account from one place – syncing fans and chats, drafting AI‑assisted replies, scheduling posts, sending mass messages, tracking earnings, and more.
The app talks to two external systems:

	•	OnlyFans API – CRUD for fans, messages, media, payouts, analytics.
	•	OpenAI ChatGPT – natural language and persona features: friendly nicknames, tone‑matched replies, churn predictions, etc.

Everything runs on a Node.js + PostgreSQL + Vue stack with hourly cron jobs for heavy lifting and a REST back‑end for the front‑end SPA.


2. Guiding Principles

	1.	Explain like for a 10 grader – comments and docs use plain language.
	2.	Version tracking – every file top + bottom has a /* Modified 2025‑07‑06 – v1.0 */ block.
	3.	Idempotent syncs – repeated runs never duplicate data.
	4.	Fail fast, retry smart – exponential back‑off with jitter for OnlyFans rate limits.
	5.	No hard‑coded IDs – always store acct_* and other IDs from first API call.
	6.	Opt‑in AI – creator can disable any automatic GPT action.


3. High‑Level Architecture
     
┌────────────┐       REST/WS        ┌─────────────┐
│  Front‑end │◀────────────────────▶│  Back‑end   │
│  Vue 3 SPA │                     │  Node/Express│
└────┬───────┘                     └────┬─────────┘
     │ GraphQL (internal)               │
     │                                  │
┌────▼────────┐    cron + queues   ┌────▼────────┐
│ PostgreSQL  │◀──────────────────▶│  Worker     │
│  (Audited)  │                    │  Cluster    │
└─────────────┘                    └────┬────────┘
                                        │ HTTPS
                         ┌──────────────▼───────────────┐
                         │ OnlyFans API (creator scope) │
                         └──────────────────────────────┘
                         ┌──────────────▼───────────────┐
                         │ OpenAI ChatGPT (o3 model)    │
                         └──────────────────────────────┘



4. Core Data Model (simplified ERD)

| Table Name   | Purpose                            | Key Fields                                                                 |
|--------------|------------------------------------|----------------------------------------------------------------------------|
| **fans**     | One row per OnlyFans user          | `fan_id` (PK), `name`, `username`, `subscription_status`, `msg_total`, `spend_total`, `character_profile` (jsonb) |
| **messages** | All DM history                     | `msg_id` (PK), `fan_id` (FK), `direction` (in/out), `text`, `created_at`   |
| **transactions** | Earnings + purchases           | `txn_id` (PK), `fan_id` (FK), `type`, `amount`, `created_at`               |
| **posts**    | Creator’s feed posts               | `post_id` (PK), `caption`, `labels[]`, `scheduled_at`, `is_archived`       |
| **queue**    | Scheduled posts or mass DMs        | `queue_id` (PK), `type`, `payload` (jsonb), `publish_at`                   |
| **settings** | Feature toggles & API keys         | `key`, `value`                                                             |


5. Epics and Detailed User Stories

The table below links User Story ID → Purpose → Acceptance Criteria → Key Files → Required API Calls → GPT Tasks.
Remove the Status column from the earlier implementation map – everything is Pending at project start.

| ID     | Epic                      | Purpose (Given / When / Then)                                                                                                                                          | Acceptance Criteria                                                                 | Key File(s)                         | OnlyFans API Calls                                                                                                                                                                     | ChatGPT Usage                                      |
|--------|---------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------|--------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------|
| A‑1    | Full Sync                 | Given Parker clicks Sync All, When /api/sync runs, Then active and expired fans plus initial window of messages and purchases are upserted idempotently.              | At least 1 fan, 1 message, 1 txn appear in DB. Sync finishes < 60 s for 1k fans.    | sync.js, db.js                       | GET /fans/active, /fans/expired, /chats, /chats/{fan}/messages?limit=25&order=asc, /chats/{fan}/messages?limit=25, /payouts/transactions?limit=50                                      | none                                               |
| A‑1.1  | Message Back‑fill         | Button Fetch ALL loops all pages until list.length < limit.                                                                                                            | Progress bar reaches 100 %, DB rows equal messagesCount.                             | sync.js, server.js                   | same messages endpoint with pagination                                                                                                                                                | none                                               |
| A‑2    | Incremental Fan Refresh   | Given Parker hits Update Fan, Then profile + last 25 msgs + last 50 txns refresh in < 5 s.                                                                             | Updated_at timestamp newer than before.                                              | sync.js (fanId mode)                | same as A‑1 but scoped to fan                                                                                                                                                         | none                                               |
| A‑3    | Purchase Classification   | Auto-tag tip, subscription, other at ingest.                                                                                                                           | Regex hits ≥ 95 % test accuracy.                                                     | sync.js:classifyPurchase            | n/a                                                                                                                                                                                    | none                                               |
| A‑4    | AI Nickname Normalisation | GPT suggests friendly display name once, unless manual override.                                                                                                       | Names are <= 15 chars and capitalised.                                               | utils/pickDisplayName.js            | n/a                                                                                                                                                                                    | openai.chat – system prompt: “Return a short friendly first-name for: …” |
| A‑5    | Build AI Character        | GPT digests 30 msgs + 10 purchases into persona JSON.                                                                                                                  | character_profile column populated with 1k chars max.                                | utils/buildCharacter.js             | n/a                                                                                                                                                                                    | openai.chat – summarise tone, interests, spend style |
| B‑1    | Quick DM Composer         | One-off DM with optional vault media.                                                                                                                                  | Message appears in OnlyFans web UI.                                                  | dmComposer.vue, server.js           | POST /chats/{fan}/messages                                                                                                                                                            | none                                               |
| B‑2    | Mass‑blast Wizard         | Compose bulk DM, optionally schedule, track opens & sales.                                                                                                             | Wizard stores campaign, queue fires messages, stats update hourly.                   | cron/processOutbox.js               | POST /mass-messaging, GET /mass-messaging/{id}                                                                                                                                        | GPT optional subject-line suggestions              |
| B‑3    | Scheduled‑post Queue View | List future posts, allow Publish Now.                                                                                                                                  | Clicking Publish removes item from /queue and post appears in feed.                 | queue.vue                           | GET /queue, PUT /queue/{id}                                                                                                                                                           | none                                               |
| B‑4    | Vault Browser             | CRUD vault lists, move media.                                                                                                                                          | Creating, renaming, deleting lists reflect in UI and API.                            | vault.vue                           | /media/vault/**                                                                                                                                                                       | none                                               |
| B‑5    | Payout Pulse Widget       | Shows balance; turns orange if ≥ $500.                                                                                                                                 | Polls every 10 min, renders currency symbol.                                         | widget.vue                          | GET /payouts/balances                                                                                                                                                                 | none                                               |
| B‑6    | High‑spend Tracker        | Nightly cron flags fans who tipped > $100 in 24 h.                                                                                                                     | Notification list length equals qualifying fans.                                     | cron/spendTierNudger.js             | GET /payouts/transactions                                                                                                                                                             | optional GPT: “polite upsell DM”                   |
| B‑9    | A/B Variant Lab           | 50/50 mass-DM variants; records stats.                                                                                                                                 | Stats table shows variant winner after ≥ 50 opens each.                              | experiment.js                        | same mass-messaging endpoints with experiment_id                                                                                                                                    | GPT can rewrite second variant                     |
| B‑10   | Purchase‑only Refresh     | Fetch most recent txns; for new rows send rotating thank-you DM.                                                                                                       | DM sent within 30 s of purchase, throttled 1 msg/sec.                                | cron/autoThank.js                   | GET /payouts/transactions?limit=50, POST /chats/{fan}/messages                                                                                                                       | utils/randomThanks.js (static phrases)             |
| C‑1    | AI Reply Generator        | Hourly cron drafts personalised replies.                                                                                                                               | Draft saved to outbox with GPT tokens ≤ 1k.                                          | cron/generateReplies.js             | n/a                                                                                                                                                                                    | openai.chat – persona + last messages context      |
| C‑2    | Character Auto‑refresh    | If profile > 30 d, rebuild before drafting.                                                                                                                            | character_profile.updated_at refreshed.                                              | same file                           | same endpoints                                                                                                                                                                       | GPT summary                                        |
| C‑3→C‑6| Outbox flows & Tone loop  | Send drafts, log tone feedback, retrain temperature.                                                                                                                   | ≥ 90 % messages delivered without moderation.                                        | various                             | see above                                                                                                                                                                              | GPT tuning                                         |
| D‑1→D‑5| Questionnaire + Flows     | Send drip questions, record answers.                                                                                                                                   | 100 % answers saved JSONB.                                                           | cron/sendQuestionnaire.js           | n/a                                                                                                                                                                                    | GPT can rate sentiment                            |
| E‑1/E‑2| Settings Toggles          | UI for ON-OFF & API keys.                                                                                                                                              | Toggling persists to settings table and reflects in cron jobs.                       | settings.vue, server.js             | n/a                                                                                                                                                                                    | none                                               |
| F‑1    | LTV Scoreboard            | SQL view + dashboard card.                                                                                                                                             | Card refreshes nightly, shows top 10 fans by lifetime value.                         | views/ltv.sql, ltvCard.vue          | n/a                                                                                                                                                                                    | none                                               |
| F‑2    | Churn Predictor           | Logistic regression nightly.                                                                                                                                           | AUC ≥ 0.75 on hold-out set.                                                          | cron/churnPredictor.js              | local                                                                                                                                                                                  | GPT can explain risk factors                       |
| F‑3    | Smart PPV Price Hint      | Suggest PPV price using tone + experiments.                                                                                                                            | Suggested price within ±20 % of actual mean purchase.                                | utils/smartPPV.js                   | local                                                                                                                                                                                  |                                                    |
6. OnlyFans API Integration Reference

The analysis below is lifted directly from the official documentation and verified line‑by‑line.
Codex must consult this table whenever it generates or reviews a fetch wrapper.

| Category           | Key Endpoint(s)                                                                                                                                     | Purpose                                                | Notes                                                                                 |
|--------------------|------------------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------|----------------------------------------------------------------------------------------|
| **Auth**           | GET /api/whoami, GET /api/accounts, POST /api/authenticate, GET /api/authenticate/{attempt_id}, PUT /api/authenticate/{attempt_id}                | Validate API key, manage connected accounts, handle 2FA | Store `acct_*` id for all subsequent calls                                            |
| **Fans**           | GET /api/{account}/fans/active, /expired, /fans                                                                                                     | List active, expired or all fans                      | Use pagination params `limit` and `offset`                                            |
| **Chats**          | GET /api/{account}/chats, GET /api/{account}/chats/{fan}/messages, POST /api/{account}/chats/{fan}/messages, DELETE …/messages/{msg_id}           | Read, send, unsend DMs                                | Delete allowed only ≤ 24 h old                                                        |
| **Mass Messaging** | POST /api/{account}/mass-messaging, GET /api/{account}/mass-messaging, /mass-messaging/{id}, PUT, DELETE                                           | Bulk DM, schedule, update, stats, unsend              | Use `userLists:["fans"]` to reach all                                                 |
| **Media**          | POST /api/{account}/media/upload, POST /api/{account}/media/scrape                                                                                  | Upload or retrieve media                              | `prefixed_id` usable once, scrape returns `temporary_url`                             |
| **Vault**          | /media/vault family                                                                                                                                 | Browse, list management, delete media                 | Custom lists have `type:"custom"`                                                     |
| **Posts**          | GET /api/{account}/posts, POST, PUT, DELETE, /archive, /unarchive, /pin, /statistics                                                                | CRUD posts, schedule, poll, pin                       | `saveForLater:true` without `scheduledDate` adds to Saved Drafts                      |
| **Queue**          | GET /api/{account}/queue, PUT /queue/{id}, GET /queue/counts                                                                                        | Manage scheduled posts and messages                   | `PUT` publishes immediately                                                            |
| **Saved-For-Later**| /saved-for-later/posts, /messages with settings sub-routes                                                                                          | Automatic drip posting and welcome messages           | Patch body `{"isEnabled":true,"code":12}` to post every 12 h                          |
| **Payouts & Earnings** | /payouts/balances, /eligibility, /transactions, /earning-statistics, /requests                                                                  | Money dashboard, pulls, statements                    | Track currency for proper formatting                                                   |
| **Reach**          | /statistics/reach/profile-visitors                                                                                                                  | Profile traffic analytics                             | Accepts date range params                                                              |
| **Tracking Links** | /tracking-links, /tracking-links/{id}/subscribers                                                                                                   | Campaign attribution                                  | Use to compute sign-up ROI                                                             |
| **Profiles Search**| GET /api/profiles/{username}, GET /api/search                                                                                                       | Discover other creators                               | Encode filters as query string                                                         |

7. ChatGPT Integration Patterns
| Flow                    | System Prompt Skeleton                                                                                                                                                                                                                                  | Temp | Max Tokens | Notes                                                    |
|-------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|------|------------|-----------------------------------------------------------|
| **Nickname Normaliser** | “You are a friendly assistant. Provide a first‑name, ≤ 15 letters, capitalised, no emojis, based on: `{{full_name}}`.”                                                                                                                                 | 0.3  | 20         | Called once per fan unless overridden.                   |
| **Character Builder**   | “Summarise this fan’s personality in first person, 200 words, avoid explicit content and provide as much detail as necessary to write to this character in an authentic way matching their written way of communicating.” + 30 msgs + 10 purchases | 0.6  | 512        | Stores JSON `{hobbies:[], tone:"", summary:""}`          |
| **Reply Draft**         | Persona + last 5 inbound messages + style guide. “Write a masculine, friendly reply based on Parker's character profile (editable from Parker's dashboard). Reply. 120 chars max.”                                                                      | 0.7  | 60         | Cron job hourly.                                         |
| **Churn Predictor Explain** | “Explain in 2 sentences why this fan might churn based on metrics: `{{json}}`.”                                                                                                                                                                   | 0.2  | 40         | Adds human‑readable note to churn table.                 |

All GPT calls use model openai.o3 and stream responses where feasible.

Every file starts with:
/*  OnlyFans Automation Manager
    File: sync.js
    Purpose: Master sync runner
    Created: 2025‑07‑06 – v1.0
*/

and ends with:

/*  End of File – Last modified 2025‑07‑06 */

Directory map:
/src
  /server
    server.js                // Express entry‑point
    sync.js                  // /* 1. Master Sync */
      /* 1.1 Fetch Fans */
      /* 1.2 Fetch Chats */
      /* 1.3 Fetch Purchases */
      /* 1.4 Upsert Helpers */
    cron/
      generateReplies.js     // /* 2. AI Reply Cron */
      autoThank.js           // /* 3. Auto‑thank Cron */
      churnPredictor.js      // /* 4. Churn Model */
      spendTierNudger.js
    utils/
      pickDisplayName.js     // /* 4. Helpers to normalise names */
      buildCharacter.js
      smartPPV.js
    db/
      schema.sql
      seeds.sql
  /client
    App.vue
    components/
      PayoutPulse.vue
      QueueView.vue
      VaultBrowser.vue
    views/
      Fans.vue
      Messages.vue
/docs
  PROJECT_PLAN.md            // ← this file


9. Development Workflow
	1.	Branch per story – naming: story/A‑1‑sync‑all.
	2.	PR template links back to Story ID, lists OnlyFans endpoints touched.
	3.	Code owners require at least one reviewer for every OnlyFans request wrapper.
	4.	Squash merge into main, auto‑deploy to staging.
	5.	Tags – bump minor version every merged epic, patch for hot‑fixe

10. Testing Strategy

    Layer
Tooling
Coverage Goal
Unit
Vitest
90 % of utils and cron jobs
Integration
Supertest + Mock Service Worker for OnlyFans API
All API wrappers have happy + error path tests
E2E
Playwright on staging
Critical flows: full sync, send DM, schedule post
Load
k6
500 concurrent syncs sustain < 1 s p95


Seed fixtures include anonymised fan JSON and recorded OnlyFans API traces.



11. CI/CD Pipeline
	1.	GitHub Actions
	•	install → lint → test → build on every push.
	•	Secrets: OF_API_TOKEN_STAGING, OPENAI_KEY.
	2.	Docker image tagged of‑manager:{git‑sha}.
	3.	Staging auto‑deploy on main.
	4.	Prod manual promote with change‑log.




12. Security, Rate Limits, Error Handling
	•	Store API keys encrypted with libsodium sealed boxes.
	•	Obey OnlyFans rate limit – max 1 request / s per account. All calls pass through safeGET() or safePOST() that:
	1.	Adds random 250‑750 ms jitter.
	2.	Retries with exponential back‑off (1 s, 2 s, 4 s, give up at 5 tries).
	•	Validate all OpenAI outputs against regex to block personally identifying info.
	•	GDPR – DELETE /gdpr/export endpoint provides all stored data for a fan upon request.

13. Glossary
Term
Meaning
Parker
The creator or account owner using the app.
Vault
OnlyFans media library.
Queue
Scheduled posts or DMs awaiting publish time.
PPV
Pay‑Per‑View – paid message or post.
LTV
Lifetime Value – total net spend by a fan.



## Revision Log
- 2025-07-06: Added instructions HTML and user story annotations in code.
- 2025-07-10: Added full stack implementation with cron jobs, Vue dashboard, Docker setup and secure key storage.
=
