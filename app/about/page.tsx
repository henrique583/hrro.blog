import Link from "next/link";

export default function Blog() {
    return (
        <div className="bg-black">
            <header className="w-1/2 mx-auto bg-blue-200">
                <nav className="flex justify-center space-x-4">
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
            <main></main>
            <footer></footer>
        </div>
    );
}
