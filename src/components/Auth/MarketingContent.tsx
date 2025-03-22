import { FC } from 'react';

const MarketingContent: FC = () => {
  return (
    <div className="rounded-lg shadow-lg p-8 lg:w-2/3">
      <h2 className="text-3xl font-bold text-gray-200 mb-4">
        Power Your Distribution with Smarter Location Intelligence
      </h2>

      <p className="text-gray-100 mb-6">
        Stay ahead in the competitive world of product distribution with S-Locator, your all-in-one
        platform for optimizing routes, reducing costs, and increasing efficiency. Whether you're
        managing fleet logistics, supply chains, or retail distribution, our geospatial intelligence
        solutions help you make data-driven decisions that drive growth.
      </p>

      <div className="mb-6">
        <div className="flex items-center text-white text-xl font-semibold mb-2">
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
          <span>Optimize Delivery Routes &amp; Reduce Costs</span>
        </div>

        <p className="text-gray-100 mb-2">
          Leverage real-time geospatial data to streamline your fleet operations. S-Locator's smart
          routing ensures:
        </p>
        <ul className="list-disc pl-5 text-gray-100 space-y-2 mb-4">
          <li>Faster deliveries with optimized routes</li>
          <li>Lower fuel and operational costs</li>
          <li>Improved on-time performance</li>
        </ul>
      </div>

      <div className="mb-6">
        <div className="flex items-center text-white text-xl font-semibold mb-2">
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
          <span>Enhance Supply Chain Visibility</span>
        </div>

        <p className="text-gray-100 mb-4">
          Gain full visibility into your distribution network. Track shipments, monitor inventory
          levels, and predict demand with location-based insights, ensuring your products reach the
          right place at the right time.
        </p>
      </div>

      <div className="mb-6">
        <div className="flex items-center text-white text-xl font-semibold mb-2">
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
          <span>Maximize Retail &amp; Distribution Impact</span>
        </div>

        <p className="text-gray-100 mb-2">
          Expand your reach by identifying high-potential markets. S-Locator helps businesses:
        </p>
        <ul className="list-disc pl-5 text-gray-100 space-y-2 mb-4">
          <li>Pinpoint the best warehouse and retail locations</li>
          <li>Analyze customer demand by region</li>
          <li>Optimize last-mile delivery strategies</li>
        </ul>
      </div>

      <p className="font-bold text-3xl text-white mb-6">
        Sign Up Now For Free &amp; Unlock the Power of Location Intelligence!
      </p>

      <div className="flex justify-center md:justify-start gap-4 md:h-8 w-auto">
        <img
          fetchpriority="high"
          src={'src/assets/images/touch.png'}
          alt="Touch"
          className="aspect-[auto_482_/_264] rounded-lg md:rounded-md h-auto w-full md:w-auto"
        />
        <img
          fetchpriority="high"
          src={'src/assets/images/city-baby.png'}
          alt="City Baby"
          className="aspect-[auto_482_/_264] rounded-lg md:rounded-md h-auto w-full md:w-auto"
        />
      </div>
    </div>
  );
};

export default MarketingContent;
