import "./globals.css";

export const metadata = {
  title: "Mini Student Reward | Stellar Soroban dApp",
  description:
    "A decentralized Web3 application on Stellar Soroban that allows teachers to reward students with native XLM tokens.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
