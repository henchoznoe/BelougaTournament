export function Footer() {
  return (
    <footer className="border-t border-zinc-800 bg-zinc-950 py-8 text-zinc-400">
      <div className="container mx-auto px-4 text-center text-sm">
        <p>&copy; {new Date().getFullYear()} Belouga Tournament. All rights reserved.</p>
        <p className="mt-2">
          Powered by <span className="text-white">Belouga</span>
        </p>
      </div>
    </footer>
  );
}
