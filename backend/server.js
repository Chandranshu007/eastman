const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const pool = require("./db");

const app = express();
const PORT = process.env.PORT || 5050;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:5173";
const JWT_SECRET = process.env.JWT_SECRET || "eastman-local-dev-secret";
const COOKIE_NAME = "eastman_auth_token";

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  path: "/",
};

const parseCookie = (req, name) => {
  const rawCookie = req.headers.cookie || "";
  const match = rawCookie
    .split(";")
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith(`${name}=`));

  if (!match) return null;
  return decodeURIComponent(match.slice(name.length + 1));
};

const getAuthenticatedUserFromRequest = (req) => {
  const token = parseCookie(req, COOKIE_NAME);
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch (error) {
    return null;
  }
};

const safeUserResponse = (user) => ({
  id: user.id,
  fullName: user.full_name,
  email: user.email,
  createdAt: user.created_at,
});

// Middleware
app.use(cors({
  origin: [FRONTEND_ORIGIN, "http://localhost:5173", "http://127.0.0.1:5173"],
  credentials: true,
}));
app.use(express.json());
app.use((req, res, next) => {
  req.authUser = getAuthenticatedUserFromRequest(req);
  next();
});

// Health-check endpoint
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "eastman-ecommerce-api",
  });
});

// ==================================================
// AUTH ROUTES
// ==================================================
const validateEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());

app.post("/api/auth/register", async (req, res) => {
  const fullName = String(req.body?.fullName || "").trim();
  const email = String(req.body?.email || "").trim().toLowerCase();
  const password = String(req.body?.password || "");

  if (!fullName || fullName.length < 2) {
    return res.status(400).json({ success: false, message: "Please enter your full name." });
  }

  if (!validateEmail(email)) {
    return res.status(400).json({ success: false, message: "Please enter a valid email address." });
  }

  if (password.length < 8 || !/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    return res.status(400).json({
      success: false,
      message: "Password must be at least 8 characters long and include a letter and a number.",
    });
  }

  try {
    const existingUser = await pool.query(
      "SELECT id FROM public.users WHERE lower(email) = lower($1)",
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const result = await pool.query(
      "INSERT INTO public.users (full_name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, full_name, email, created_at",
      [fullName, email, passwordHash]
    );

    const user = result.rows[0];
    const token = jwt.sign(
      { sub: user.id, email: user.email, fullName: user.full_name },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: 1000 * 60 * 60 * 24 * 7 });

    return res.status(201).json({
      success: true,
      message: "Account created successfully.",
      user: safeUserResponse(user),
    });
  } catch (error) {
    console.error("Registration error:", error.message);
    return res.status(500).json({ success: false, message: "Unable to create your account right now." });
  }
});

app.post("/api/auth/login", async (req, res) => {
  const email = String(req.body?.email || "").trim().toLowerCase();
  const password = String(req.body?.password || "");
  const rememberMe = Boolean(req.body?.rememberMe);

  if (!validateEmail(email)) {
    return res.status(400).json({ success: false, message: "Please enter a valid email address." });
  }

  if (!password) {
    return res.status(400).json({ success: false, message: "Please enter your password." });
  }

  try {
    const result = await pool.query(
      "SELECT id, full_name, email, password_hash, created_at FROM public.users WHERE lower(email) = lower($1)",
      [email]
    );

    const user = result.rows[0];
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid email or password." });
    }

    const passwordMatches = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatches) {
      return res.status(401).json({ success: false, message: "Invalid email or password." });
    }

    const token = jwt.sign(
      { sub: user.id, email: user.email, fullName: user.full_name },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.cookie(COOKIE_NAME, token, {
      ...cookieOptions,
      maxAge: rememberMe ? 1000 * 60 * 60 * 24 * 30 : 1000 * 60 * 60 * 24,
    });

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      user: safeUserResponse(user),
    });
  } catch (error) {
    console.error("Login error:", error.message);
    return res.status(500).json({ success: false, message: "Unable to sign you in right now." });
  }
});

app.get("/api/auth/me", async (req, res) => {
  if (!req.authUser) {
    return res.status(401).json({ success: false, message: "Unauthorized." });
  }

  try {
    const result = await pool.query(
      "SELECT id, full_name, email, created_at FROM public.users WHERE id = $1",
      [req.authUser.sub]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, message: "Unauthorized." });
    }

    return res.status(200).json({
      success: true,
      user: safeUserResponse(result.rows[0]),
    });
  } catch (error) {
    console.error("Auth me error:", error.message);
    return res.status(500).json({ success: false, message: "Unable to validate your session." });
  }
});

app.post("/api/auth/logout", (req, res) => {
  res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: 0 });
  return res.status(200).json({ success: true, message: "Logged out successfully." });
});

// ==================================================
// GET ALL PRODUCTS
// ==================================================
app.get("/api/products", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        id,
        name,
        description,
        price,
        COALESCE(original_price, price) AS original_price,
        stock AS stock_quantity,
        category,
        image_url,
        is_active,
        created_at
      FROM public.products
      WHERE is_active = TRUE
      ORDER BY id
    `);

    res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    console.error("Error fetching products:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to fetch products.",
    });
  }
});

// ==================================================
// GET A SINGLE PRODUCT BY ID
// ==================================================
app.get("/api/products/:id", async (req, res) => {
  const productId = Number(req.params.id);

  if (!Number.isInteger(productId) || productId <= 0) {
    return res.status(400).json({
      success: false,
      message: "Invalid product ID.",
    });
  }

  try {
    const result = await pool.query(
      `
      SELECT
        id,
        name,
        description,
        price,
        COALESCE(original_price, price) AS original_price,
        stock AS stock_quantity,
        category,
        image_url,
        is_active,
        created_at
      FROM public.products
      WHERE id = $1
        AND is_active = TRUE
      `,
      [productId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }

    res.status(200).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Error fetching product:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to fetch product.",
    });
  }
});

// ==================================================
// VALIDATE COUPON USING POSTGRESQL
// ==================================================
app.post("/api/coupons/validate", async (req, res) => {
  const { code, subtotal } = req.body;

  // Validate request data
  if (
    typeof code !== "string" ||
    !code.trim() ||
    typeof subtotal !== "number" ||
    !Number.isFinite(subtotal) ||
    subtotal < 0
  ) {
    return res.status(400).json({
      success: false,
      message: "Provide a valid coupon code and subtotal.",
    });
  }

  try {
    // Find an active, unexpired coupon
    const result = await pool.query(
      `
      SELECT
        id,
        code,
        discount_type,
        discount_value,
        min_order_amount,
        max_discount,
        expires_at,
        is_active
      FROM public.coupons
      WHERE UPPER(code) = UPPER($1)
        AND is_active = TRUE
        AND (
          expires_at IS NULL
          OR expires_at > NOW()
        )
      LIMIT 1
      `,
      [code.trim()]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid, inactive, or expired coupon.",
      });
    }

    const coupon = result.rows[0];

    // Check minimum order amount
    if (subtotal < Number(coupon.min_order_amount)) {
      return res.status(400).json({
        success: false,
        message: `Minimum order amount is ₹${coupon.min_order_amount}.`,
      });
    }

    let discountAmount;

    // Calculate percentage discount
    if (coupon.discount_type === "percent") {
      discountAmount =
        (subtotal * Number(coupon.discount_value)) / 100;

      // Apply maximum discount limit when configured
      if (coupon.max_discount !== null) {
        discountAmount = Math.min(
          discountAmount,
          Number(coupon.max_discount)
        );
      }
    } else if (coupon.discount_type === "fixed") {
      // Calculate fixed discount
      discountAmount = Number(coupon.discount_value);
    } else {
      return res.status(400).json({
        success: false,
        message: "Unsupported coupon discount type.",
      });
    }

    // A discount cannot exceed the order subtotal
    discountAmount = Math.min(discountAmount, subtotal);

    discountAmount = Number(discountAmount.toFixed(2));

    const finalAmount = Number(
      (subtotal - discountAmount).toFixed(2)
    );

    res.status(200).json({
      success: true,
      message: "Coupon applied successfully.",
      data: {
        coupon_code: coupon.code,
        subtotal,
        discount_amount: discountAmount,
        final_amount: finalAmount,
      },
    });
  } catch (error) {
    console.error("Coupon validation error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to validate coupon.",
    });
  }
});

// ==================================================
// START SERVER
// ==================================================
app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});