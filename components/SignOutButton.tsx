export function SignOutButton() {
  return (
    <form action="/auth/signout" method="post">
      <button
        type="submit"
        className="text-[10px] uppercase tracking-[0.25em] text-white/60 hover:text-aiapp-aqua transition whitespace-nowrap"
      >
        Sign out
      </button>
    </form>
  );
}
