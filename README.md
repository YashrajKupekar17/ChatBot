Setup Instructions
Clone the repository:
git clone https://github.com/your-username/hotel-booking-chatbot.git

Install dependencies:
cd hotel-booking-chatbot
npm install

Set up the OpenAI API key:
Create an account on the OpenAI platform if you haven't already.
Navigate to the API keys page and click on "Create new secret key".
Optionally, provide a name for the key and click "Create secret key".
Create a .env file in the project root directory and add the following line, replacing YOUR_OPENAI_API_KEY with the secret key you just generated:
OPENAI_API_KEY=YOUR_OPENAI_API_KEY

Set up email credentials (optional):
If you want to send booking confirmation emails, you'll need to provide your email credentials.
In the .env file, add the following lines, replacing YOUR_EMAIL_USER and YOUR_EMAIL_PASSWORD with your email credentials:
EMAIL_USER=YOUR_EMAIL_USER
EMAIL_PASSWORD=YOUR_EMAIL_PASSWORD

Start the server:
npm start

The server will start running on http://localhost:3000.
Example API Requests and Responses
List Hotel Room Options
Request:
curl -X GET http://localhost:3000/rooms

Response:
json
[
  {
    "id": 1,
    "name": "Standard Room",
    "price": 100
  },
  {
    "id": 2,
    "name": "Deluxe Room",
    "price": 150
  },
  {
    "id": 3,
    "name": "Suite",
    "price": 200
  }
]

Create a Booking
Request:
curl -X POST http://localhost:3000/book \
  -H "Content-Type: application/json" \
  -d '{
    "roomId": 2,
    "fullName": "John Doe",
    "email": "john.doe@example.com",
    "nights": 3
  }'

Response:
json
{
  "id": 1,
  "roomId": 2,
  "name": "Deluxe Room",
  "price": 150,
  "nights": 3,
  "total": 450
}

Chat with the Chatbot
Request:
curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "message": "I'd like to book a room at your hotel"
  }'

Response:
json
{
  "response": "Hello! I'd be happy to help you book a room. What dates are you looking to stay?"
}

Subsequent request:
curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "message": "I'd like to stay for 3 nights starting on July 1st"
  }'

Response:
json
{
  "response": "Great, let me check our available rooms for those dates. Here are the options:\n\n[Room Options]\n\nDo any of those work for you? Let me know which room you'd like to book."
}

Subsequent request:
curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "message": "I'd like to book the Deluxe Room"
  }'

Response:
json
{
  "response": "Okay, the Deluxe Room is $150 per night for 3 nights, so the total cost will be $450. Does this work for you? If so, I can go ahead and book the room."
}

Subsequent request:
curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "message": "Yes, please book the Deluxe Room"
  }'

Response:
json
{
  "response": "Great, I've booked the Deluxe Room for you. Here are the details:\n\nRoom: Deluxe Room\nNights: 3\nTotal Cost: $450\nBooking ID: 123456\n\nI've also sent a confirmation email to john.doe@example.com. Let me know if you need anything else!"
}
