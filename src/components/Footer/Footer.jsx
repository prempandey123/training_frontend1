import './footer.css';

export default function Footer() {
  return (
    <footer className="footer">
      <span>
        © {new Date().getFullYear()} Hero Steels Limited. All rights reserved.
      </span>
    </footer>
  );
}
