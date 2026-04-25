import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export async function POST(req: Request) {
    const { email, password } = await req.json();

    if (
        email !== process.env.ADMIN_EMAIL ||
        password !== process.env.ADMIN_PASSWORD
    ) {
        return NextResponse.json(
            { message: "Invalid email or password" },
            { status: 401 }
        );
    }

    const token = jwt.sign(
        { role: "admin" },
        process.env.JWT_SECRET!,
        { expiresIn: "7d" }
    );

    const res = NextResponse.json({ message: "Login successful" });

    res.cookies.set("accessToken", token, {
        httpOnly: true,
        secure: true,
        path: "/",
        maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return res;
}
