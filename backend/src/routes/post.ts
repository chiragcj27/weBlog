import { PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";
import { Hono } from "hono";
import { verify } from "hono/jwt";

export const postRouter = new Hono<{
    Bindings: {
		DATABASE_URL: string
        JWT_SECRET: string
	},
	Variables: {
		userId: String
	}
}>();

postRouter.use("/*", async (c,next) => {
	const authHeader = c.req.header("authorization") || "";
	const user = await verify(authHeader, c.env.JWT_SECRET);
	if(user) {
		c.set("userId", user.id);
		await next();
	} else {
		c.status(403);
		return c.json({
			message: "You are not logged in"
		})
	}
})

postRouter.post('/', async (c) => {
	const body = await c.req.json();
	const authorId = c.get("userId");
	const prisma = new PrismaClient({
		datasourceUrl: c.env.DATABASE_URL,
	}).$extends(withAccelerate())

	const post = await prisma.post.create({
		data: {
			title: body.title,
			content: body.content,
			authorId: Number(authorId)
		}
	})

	return c.json({
		id: post.id
	})
})

postRouter.put('/', async (c) => {
	const body = await c.req.json();
	const authorId = c.get("userId");
	const prisma = new PrismaClient({
		datasourceUrl: c.env.DATABASE_URL,
	}).$extends(withAccelerate())

	const post = await prisma.post.update({
		where: {
			id: body.id,
			authorId: Number(authorId)
		},
		data: {
			title: body.title,
			content: body.content,
		}
	})

	return c.json({
		id: post.id
	})
})

postRouter.get('/', async (c) => {
	const body = await c.req.json();
	const prisma = new PrismaClient({
		datasourceUrl: c.env.DATABASE_URL,
	}).$extends(withAccelerate());

	try {

	const post = await prisma.post.findFirst({
		where: {
			id: body.id
		}
	})

	return c.json({
		post
	})

	}catch(e) {
		c.status(411);
		return c.json({
			message: "Error while fetching bog post"
		})
	}
})

//pagination -- 10 at a time
postRouter.get('/bulk', async (c) => {
	const prisma = new PrismaClient({
		datasourceUrl: c.env.DATABASE_URL,
	}).$extends(withAccelerate())

	const posts = await prisma.post.findMany();

	return c.json({
		posts
	})
})