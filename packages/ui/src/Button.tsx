import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react';

type Common = { variant: 'primary' | 'ghost'; arrow?: boolean; children: ReactNode };
type AsLink = Common & { href: string } & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href' | 'children'>;
type AsButton = Common & { href?: undefined } & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'>;

export function Button(props: AsLink | AsButton) {
    const { variant, arrow, children, className, ...rest } = props;
    const classes = [variant === 'primary' ? 'btn' : 'ghost', className].filter(Boolean).join(' ');
    const content = (
        <>
            {children}
            {(arrow ?? props.href !== undefined) && (
                <span className="ar" aria-hidden="true">
                    →
                </span>
            )}
        </>
    );

    if (props.href !== undefined) {
        return (
            <a {...(rest as AnchorHTMLAttributes<HTMLAnchorElement>)} className={classes}>
                {content}
            </a>
        );
    }
    return (
        <button type="button" {...(rest as ButtonHTMLAttributes<HTMLButtonElement>)} className={classes}>
            {content}
        </button>
    );
}
