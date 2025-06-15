import emailjs from '@emailjs/browser';

export function sendInvoiceEmail({
  to_email,
  to_name,
  invoiceNumber,
  html,
  ...rest
}) {
  return emailjs.send(
    'service_d4mb339',        // Your EmailJS Service ID
    'template_i5qq76e',       // Your EmailJS Template ID
    {
      to_email,
      to_name,
      invoiceNumber,
      html_message: html,     // The HTML body, e.g. with items table
      ...rest
    },
    'OYC5r8CivDxQ6dCqi'       // Your EmailJS Public Key
  );
}