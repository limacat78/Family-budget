const Footer = () => {
  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
        <p className="text-center text-sm text-gray-500">© {new Date().getFullYear()} Gestor de Orçamento Familiar. Todos os direitos reservados.</p>
      </div>
    </footer>
  );
};

export default Footer;
