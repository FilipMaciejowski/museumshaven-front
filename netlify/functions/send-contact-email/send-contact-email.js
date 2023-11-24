const sanitizeHtml = require("sanitize-html");
const {
  MAILGUN_API_KEY,
  MAILGUN_DOMAIN,
  MAILGUN_URL,
  FROM_EMAIL_ADDRESS,
  TO_EMAIL_ADDRESSES,
} = process.env;
const mailgun = require("mailgun-js")({
  apiKey: MAILGUN_API_KEY,
  domain: MAILGUN_DOMAIN,
  url: MAILGUN_URL,
  host: "api.mailgun.net",
});

const validateFormInputs = (email, name, content) => {
  if (
    email.length < 5 ||
    !email.match(
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    )
  )
    return false;

  if (name.length < 2 || /\d/.test(name)) return false;

  if (content.length < 2) return false;

  return true;
};

export const handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: "Method Not Allowed",
      headers: { Allow: "POST" },
    };
  }

  let { email, name, content } = JSON.parse(event.body);

  // check if all variables have been sent
  if (!email || !name || !content) {
    return {
      statusCode: 422,
      body: "Email, name, content are required",
    };
  }

  // sanitize
  email = email.trim().toLowerCase();
  name = sanitizeHtml(name);
  content = sanitizeHtml(content);

  if (!validateFormInputs(email, name, content)) {
    return {
      statusCode: 400,
      body: "Invalid form inputs",
    };
  }

  try {
    // prepare and send transactional emails
    for (const toEmailAddress of TO_EMAIL_ADDRESSES.split(" ")) {
      const emailData = {
        from: FROM_EMAIL_ADDRESS,
        to: toEmailAddress,
        "h:Reply-To": email,
        subject: "New form submission",
        text: `${content.trim()}\n\n${name.trim()}\n\nEposten er sendt fra et skjema på bybarbro.no`,
      };

      await mailgun.messages().send(emailData);
    }

    return {
      statusCode: 200,
    };
  } catch (error) {
    console.log(error);
    return { statusCode: 500, body: error.toString() };
  }
};
