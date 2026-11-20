import { Outlet } from 'react-router';

const AppLayout = () => {
  return (
    <div className='flex min-h-screen flex-col bg-slate-50 text-slate-900'>
      {/* TODO: HEADER */}

      <main className='mx-auto w-full max-w-4xl flex-1 px-4 py-6 sm:px-6 sm:py-8'>
        <Outlet />
      </main>

      {/* TODO: FOOTER */}
    </div>
  );
};

export default AppLayout;
