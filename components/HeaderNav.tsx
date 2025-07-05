import Link from "next/link";

export default function HeaderNav() {
    return (
        <header className="w-1/2 mx-auto bg-transparent">
            <nav className="flex justify-center space-x-4 text-white">
                <Link href="/">
                    <span>HRRO</span>
                </Link>
                <Link href="/blog">
                    <span>BLOG</span>
                </Link>
                <Link href="/projects">
                    <span>PROJECTS</span>
                </Link>
                <Link href="/about">
                    <span>ABOUT</span>
                </Link>
            </nav>
        </header>
    );
}
