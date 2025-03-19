import React from 'react';
import MarketingContent from '../../components/Auth/MarketingContent';
import SignUpForm from '../../components/Auth/SignUpForm';
import { SignUpProvider } from '../../context/SignUpContext';

const SignUp: React.FC = () => {
  return (
    <SignUpProvider>
      <main className="w-full font-rajdhani text-gray-50 min-h-screen overflow-y-scroll bg-no-repeat bg-scroll bg-origin-padding bg-clip-border bg-[radial-gradient(circle,rgb(44,24,74)_0%,rgb(18,4,25)_33%)]">
        <div className="container mx-auto px-6 py-12">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Left Column - Marketing Content */}
            <MarketingContent />

            {/* Right Column - Sign Up Form */}
            <SignUpForm />
          </div>
        </div>
      </main>
    </SignUpProvider>
  );
};

export default SignUp;
