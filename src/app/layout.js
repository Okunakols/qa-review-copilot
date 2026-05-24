import './globals.css';

export const metadata = {
  title: 'DocuReview AI \u2014 Intelligent QA Document Review',
  description:
    'Purpose-built QA document review platform for medical device industry. ISO 13485, EU MDR, FDA 21 CFR Part 820.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
        <script
          src="https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.8.0/mammoth.browser.min.js"
          async
        />
        <script
          src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"
          async
        />
        <script
          src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"
          async
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
