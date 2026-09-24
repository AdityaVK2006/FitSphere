const User = require("../models/User.js");
const Member = require("../models/Member.js");
const roleMiddleware = require("../middleware/roleMiddleware.js");
const authMiddleware = require("../middleware/authMiddleware.js");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const express = require("express");
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || "smartgym-demo-secret";
const DEMO_USERS = {
    admin: {
        id: "demo-admin",
        name: "Ravi Deshmukh",
        email: "admin@smartgym.in",
        password: "demo1234",
        role: "admin"
    },
    member: {
        id: "demo-member",
        name: "Rahul Sharma",
        email: "rahul@smartgym.in",
        password: "demo1234",
        role: "member"
    }
};

const issueToken = (user) => jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: "1d" });

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
    const { email, password } = req.body;
    const normalizedEmail = String(email || "").trim().toLowerCase();

    const demoUser = Object.values(DEMO_USERS).find((user) => user.email.toLowerCase() === normalizedEmail);
    if (demoUser && demoUser.password === password) {
        const token = issueToken(demoUser);
        return res.json({
            success: true,
            message: "Login successful",
            token,
            user: {
                id: demoUser.id,
                name: demoUser.name,
                email: demoUser.email,
                role: demoUser.role.toUpperCase()
            }
        });
    }

    const user = await User.findOne({ email: normalizedEmail });
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

    const memberProfile = user.role === "member" ? await Member.findOne({ userId: user._id }).lean() : null;
    const token = issueToken({ id: user._id.toString(), role: user.role });

   res.json({
    success: true,
    message: "Login successful",
    token: token,
    user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role.toUpperCase(),
        member: memberProfile ? {
            id: memberProfile._id,
            membershipPlan: memberProfile.membershipPlan,
            phone: memberProfile.phone,
            membershipStartDate: memberProfile.membershipStartDate,
            address: memberProfile.address
        } : null
    }
});
})


router.post("/admin/create-member", authMiddleware, roleMiddleware(["admin"]), async (req, res) => {
    const {
      name,
      email,
      password,
      phone,
      gender,
      dateOfBirth,
      emergencyContact,
      address,
      height,
      weight,
      primaryGoal,
      experienceLevel,
      trainingDaysPerWeek,
      medicalNotes,
      membershipPlan,
      membershipStartDate,
      paymentMethod,
      amountPaid
    } = req.body;

    const existingUser = await User.findOne({ email: String(email || "").trim().toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email already registered"
      });
    }

    if (!name || !email || !password || !membershipPlan || !membershipStartDate) {
      return res.status(400).json({
        success: false,
        message: "Name, email, password, membership plan and start date are required"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      email: String(email).trim().toLowerCase(),
      password: hashedPassword,
      role: "member"
    });

    await newUser.save();

    const newMember = new Member({
      userId: newUser._id,
      name,
      phone: phone || "",
      gender: gender || "Other",
      dateOfBirth: dateOfBirth || undefined,
      emergencyContact: emergencyContact || "",
      address: address || "",
      height: height || undefined,
      weight: weight || undefined,
      primaryGoal: primaryGoal || "",
      experienceLevel: experienceLevel || "Beginner",
      trainingDaysPerWeek: trainingDaysPerWeek || 0,
      medicalNotes: medicalNotes || "",
      membershipPlan,
      membershipStartDate,
      paymentMethod: paymentMethod || "Cash",
      amountPaid: amountPaid || 0
    });

    await newMember.save();

    res.status(201).json({
      success: true,
      message: "Member created successfully",
      member: {
        id: newMember._id,
        userId: newUser._id,
        name,
        email: newUser.email,
        membershipPlan
      }
    });
});

router.get("/profile", authMiddleware, async(req, res) => {
    const userId = req.user.userId;
    const user = await User.findById(userId);
    if (!user) {
        return res.status(404).json({
            success: false,
            message: "User not found"
        });
    }

    const memberProfile = await Member.findOne({ userId: user._id }).lean();

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role.toUpperCase(),
        member: memberProfile ? {
          id: memberProfile._id,
          membershipPlan: memberProfile.membershipPlan,
          membershipStartDate: memberProfile.membershipStartDate,
          phone: memberProfile.phone,
          gender: memberProfile.gender,
          address: memberProfile.address
        } : null
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