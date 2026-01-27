import Link from "next/link";

export default function Header() {
    return (
        <header className="fixed top-8 left-1/2 -translate-x-1/2 border pt-4 pr-8 pb-4 pl-8 rounded-full z-50 mb-4 backdrop-blur-xs">
            <nav className="flex gap-4">
                <Link href="/">HRRO</Link>
                <Link href="/blog">BLOG</Link>
                <Link href="/projects">PROJECTS</Link>
            </nav>
        </header>
    );
}
