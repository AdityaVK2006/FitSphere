const User = require("../models/User.js");
const Member = require("../models/Member.js");
const roleMiddleware = require("../middleware/roleMiddleware.js");
const authMiddleware = require("../middleware/authMiddleware.js");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const express = require("express");
const router = express.Router();

router.post("/register", async(req, res) => {
    const{name, email, password} = req.body;
    const existingUser = await User.findOne({email});
    if (existingUser) {
    return res.status(400).json({
        success: false,
        message: "Email already registered"
    });
}
const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
       name: name,
       email: email,
       password: hashedPassword,
    });
    await newUser.save();
    res.status(201).json({
    success: true,
    message: "User registered successfully"
});
})


router.post("/login", async(req, res) => {
    const {email, password} = req.body;
    const user = await User.findOne({email});
    if(!user){
        return res.status(400).json({
            success: false,
            message: "Invalid email or password"
        })
    }
    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
       return res.status(400).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    const token = jwt.sign(
    { userId: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }

    );

   res.json({
    success: true,
    message: "Login successful",
    token: token,
    user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
    }
});
})


router.post("/admin/create-member", authMiddleware, roleMiddleware(["admin"]), async (req, res) => {
    const {
    name,
    email,
    password
    } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
    return res.status(400).json({
        success: false,
        message: "Email already registered"
    });
  }
  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = new User({
    name,
    email,
    password: hashedPassword,
    role: "member"
  });

  await newUser.save();

  const newMember = new Member({
    userId: newUser._id,
    name
 });

 await newMember.save();

 res.status(201).json({
    success: true,
    message: "Member created successfully"
});

})

router.get("/profile", authMiddleware, async(req, res) => {
    const userId = req.user.userId;
    const user = await User.findById(userId);
if (!user) {

    return res.status(404).json({
        success: false,
        message: "User not found"
      });

     }

    res.json({
    success: true,
    user: {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role
}
});

});

router.get("/admin-test",authMiddleware, roleMiddleware(["admin"]), (req, res) => {
     res.json({
        success: true,
        message: "Admin access granted"
    });
})


module.exports = router;