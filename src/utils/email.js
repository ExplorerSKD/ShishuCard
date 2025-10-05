import emailjs from 'emailjs-com';

const sendEmail = async ({ name, to_email, message }) => {
  const templateParams = {
    user_name: name,
    user_email: to_email,
    to_email: to_email,
    message: message,
  };

  try {
    const result = await emailjs.send(
      import.meta.env.VITE_EMAILJS_SERVICE_ID,
      import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
      templateParams,
      import.meta.env.VITE_EMAILJS_PUBLIC_KEY
    );
    console.log('✅ Email sent successfully:', result);
  } catch (error) {
    console.error('❌ Failed to send email:', error);
  }
};

export default sendEmail;
