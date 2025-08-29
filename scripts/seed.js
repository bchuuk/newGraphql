// scripts/seed.js
import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function seed() {
  try {
    console.log("🌱 Starting database seed...")

    // Create God user
    const godPassword = await bcrypt.hash("GodPassword123!", 10)
    const god = await prisma.user.create({
      data: {
        email: "god@example.com",
        username: "god",
        displayName: "System God",
        password: godPassword,
        role: "GOD",
        status: "ACTIVE",
        emailVerified: true,
      },
    })

    // Create Admin user
    const adminPassword = await bcrypt.hash("AdminPassword123!", 10)
    const admin = await prisma.user.create({
      data: {
        email: "admin@example.com",
        username: "admin",
        displayName: "System Admin",
        password: adminPassword,
        role: "ADMIN",
        status: "ACTIVE",
        emailVerified: true,
      },
    })

    // Create test users
    const userPassword = await bcrypt.hash("Password123!", 10)
    const users = []

    for (let i = 1; i <= 10; i++) {
      const user = await prisma.user.create({
        data: {
          email: `user${i}@example.com`,
          username: `user${i}`,
          displayName: `Test User ${i}`,
          password: userPassword,
          role: "USER",
          status: "ACTIVE",
          emailVerified: true,
          bio: `This is test user ${i}`,
        },
      })
      users.push(user)
    }

    // Create some follows
    for (let i = 0; i < 5; i++) {
      for (let j = i + 1; j < 6; j++) {
        await prisma.follow.create({
          data: {
            followerId: users[i].id,
            followingId: users[j].id,
          },
        })
      }
    }

    // Create test posts
    const posts = []
    for (let i = 0; i < 20; i++) {
      const randomUser = users[Math.floor(Math.random() * users.length)]
      const post = await prisma.post.create({
        data: {
          title: `Test Post ${i + 1}`,
          content: `This is the content of test post ${
            i + 1
          }. Lorem ipsum dolor sit amet, consectetur adipiscing elit.`,
          authorId: randomUser.id,
          status: "PUBLISHED",
          visibility: "PUBLIC",
          publishedAt: new Date(),
        },
      })
      posts.push(post)
    }

    // Create some likes and comments
    for (const post of posts.slice(0, 10)) {
      // Random likes
      const likeCount = Math.floor(Math.random() * 5) + 1
      const likedUsers = users.slice(0, likeCount)

      for (const user of likedUsers) {
        await prisma.like.create({
          data: {
            userId: user.id,
            postId: post.id,
          },
        })
      }

      // Random comments
      const commentCount = Math.floor(Math.random() * 3) + 1
      for (let i = 0; i < commentCount; i++) {
        const randomUser = users[Math.floor(Math.random() * users.length)]
        await prisma.comment.create({
          data: {
            content: `This is a comment on post ${post.title}`,
            authorId: randomUser.id,
            postId: post.id,
            status: "ACTIVE",
          },
        })
      }
    }

    // Create notification settings for all users
    for (const user of [...users, admin, god]) {
      await prisma.notificationSetting.create({
        data: {
          userId: user.id,
          pushEnabled: true,
          emailEnabled: true,
          newFollower: true,
          newPost: true,
          postLiked: true,
          postCommented: true,
          mentioned: true,
        },
      })
    }

    console.log("✅ Database seeded successfully!")
    console.log(`👑 God user: god@example.com / GodPassword123!`)
    console.log(`👮 Admin user: admin@example.com / AdminPassword123!`)
    console.log(
      `👤 Test users: user1@example.com to user10@example.com / Password123!`
    )
  } catch (error) {
    console.error("❌ Error seeding database:", error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

seed()
