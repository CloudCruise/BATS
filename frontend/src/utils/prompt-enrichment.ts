const getDifficultyInstructions = (diff: string) => {
  switch (diff) {
    case "easy":
      return `Create a simple, clean website with minimal elements. Use basic styling and straightforward interactions.`;
    case "hard":
      return `Create a complex, feature-rich website with a full suite elements for the type of website you are creating. If appropriate, use advanced styling, multiple sections, dynamic content, nested forms, modals, dropdowns, carousels, multi-page forms, and complex user flows.`;
    default: // medium
      return `Create a realistic website with all typical elements for the type of website you are creating.`;
  }
};

const getWebsiteTypeInstructions = (type: string) => {
  switch (type) {
    case "insurance":
      return `Style as an insurance website with scenarios like policy forms, quote calculators, claim submission forms, and coverage comparison tables. Take platforms like geico, statefarm, united healthcare, etc. as inspiration.`;
    case "healthcare":
      return `Style as a healthcare website with scenarios like appointment booking, patient forms, symptom checkers, and medical information sections. Take platforms like doctor.com, webmd, etc. as inspiration.`;
    case "ecommerce":
      return `Style as an e-commerce website with scenarios like product catalogs, shopping cart, checkout forms, product filters, reviews, and promotional banners. Take platforms like amazon, ebay, bestbuy, target, apple, etc. as inspiration.`;
    case "banking":
      return `Style as a banking website with scenarios like account login forms, transaction tables, loan calculators, and financial tools. Take platforms like chase, wells fargo, etc. as inspiration.`;
    case "education":
      return `Style as an educational website with scenarios like course catalogs, enrollment forms, student portals, assignment submissions, and academic calendars. Take platforms like edx, coursera, etc. as inspiration.`;
    case "government":
      return `Style as a government website with scenarios like permit applications, service forms, document uploads, and bureaucratic workflows. Take platforms like usps, etc. as inspiration.`;
    case "travel":
      return `Style as a travel website with scenarios like booking forms, destination galleries, itinerary builders, review systems, and travel planning tools. Take platforms like expedia, booking.com, etc. as inspiration.`;
    case "real-estate":
      return `Style as a real estate website with scenarios like property listings, search filters, contact forms, virtual tour buttons, and mortgage calculators. Take platforms like zillow, redfin, etc. as inspiration.`;
    default: // generic
      return `Come up with a realistic and interesting scenario where the requested scenario could happen in real life. Style it accordingly. Feel free to be creative what you use as inspiration.`;
  }
};

export const createUserPrompt = (
  prompt: string,
  difficulty: string,
  websiteType: string
) => {
  const difficultyInstructions = getDifficultyInstructions(difficulty);
  const websiteTypeInstructions = getWebsiteTypeInstructions(websiteType);
  return `Prompt: ${prompt}\nDifficulty: ${difficultyInstructions}\nWebsite Type: ${websiteTypeInstructions}`;
};
