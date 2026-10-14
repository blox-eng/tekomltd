import { Link } from '@/i18n/navigation';

export default function NotFound() {
    return (
        <div className="wrap page">
            <h1>404</h1>
            <p>
                <Link href="/" className="link">
                    Tekom <span className="ar">→</span>
                </Link>
            </p>
        </div>
    );
}
