import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from "react";

type LinkButtonProps = AnchorHTMLAttributes<HTMLAnchorElement> & { href: string };
type NativeButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined };

export type ButtonProps = LinkButtonProps | NativeButtonProps;

const baseClassName =
  "font-display font-medium rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-desert-accent disabled:opacity-50 disabled:pointer-events-none";

export function Button(props: ButtonProps) {
  const { children, className, ...rest } = props;
  const combinedClassName = className ? `${baseClassName} ${className}` : baseClassName;

  if (props.href) {
    return (
      <Link {...(rest as Omit<LinkButtonProps, "children" | "className" | "href">)} href={props.href} className={combinedClassName}>
        {children}
      </Link>
    );
  }

  return (
    <button {...(rest as Omit<NativeButtonProps, "children" | "className" | "href">)} className={combinedClassName}>
      {children}
    </button>
  );
}
