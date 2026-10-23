import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-about">
          <Link className="brand footer-brand" to="/">
            <span className="brand-mark">E</span>
            <span>Eastman <strong>Store</strong></span>
          </Link>
          <p>Thoughtful finds for a better everyday.</p>
        </div>
        <div>
          <h3>Quick links</h3>
          <Link to="/">Home</Link>
          <Link to="/#categories">Categories</Link>
          <Link to="/cart">Shopping cart</Link>
        </div>
        <div>
          <h3>Customer support</h3>
          <p>Questions? Our support team is here to help.</p>
          <a href="mailto:support@eastmanstore.example">support@eastmanstore.example</a>
        </div>
      </div>
      <div className="footer-bottom">© {new Date().getFullYear()} Eastman Store. All rights reserved.</div>
    </footer>
  );
}
