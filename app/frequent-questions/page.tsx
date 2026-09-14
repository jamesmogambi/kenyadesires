import React from "react";
import FaqCard from "@/components/FaqCard";

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

const faqs = [
  {
    question: "Question No. 1: How do I pay for advertising?",
    answer: `Visit this page: https://kenyadesires.xyz/extend and select the number of credits you want to top up. Then click the "ORDER" button.
Immediately after clicking the "ORDER" button, a page with payment details will be displayed. You will also receive these details via SMS and email. If you go back, the page will disappear and you will have the payment details only in your email or SMS.
The variable symbol is DIFFERENT for every order! It is important to enter the correct variable symbol so the system recognizes the payment and automatically credits your account and extends the listing.
You can top up more credits and the system will automatically deduct them each month to extend your listing. You can disable this auto-renewal in your account settings.`,
  },
  {
    question: "Question No. 2: Why is advertising paid via credits?",
    answer: `The main reason is the option to boost (highlight) listings, which on our site works on a credit basis. You top up a certain number of credits to your account and pay for advertising from this credit balance, while any remaining credits can be used to boost your listing. So it's enough to top up enough credits once, and with them you can control both boosting and, of course, the advertising itself.
If you have enough credits, you can also set automatic renewal of advertising so you don't have to worry about anything.
One credit = KSH 10`,
  },
  {
    question: "Question No. 3: How can I disable my profile?",
    answer: `After logging in on the website, click "ACCOUNT SETTINGS".
From the menu, select "EDIT PROFILE".
You will see your profile, and under the girl's name you have the option to set the profile as ACTIVE / INACTIVE. Choose INACTIVE and click save. Your profile will stop being displayed on the website. If you want to restore your profile, follow the same steps, check YES, and save again.
Please note that if you disable your profile for, e.g., 5 days, it does not affect the length of the advertising period, which continues to run; we do not add 5 extra days.`,
  },
  {
    question: "Question No. 4: How can I delete my profile completely?",
    answer: `After logging in on the website, click "ACCOUNT SETTINGS".
From the menu, select "EDIT PROFILE".
If you want to completely delete your account on the website, including login details, contact us at hello@kenyadesires.com and we will delete it immediately.`,
  },
  {
    question:
      "Question No. 5: Why am I appearing at the back of my city's category?",
    answer: `Each girl has a unique number that resets every day. The order is randomly shuffled, which means placement on the page is not fixed. This ensures a fair approach for everyone.
For even better placement, use the boosting feature.`,
  },
  {
    question:
      "Question No. 6: I'm only a masseuse and I'm not displayed in the catalog.",
    answer: `If you offer only erotic massages, you are displayed only in the "Erotic Massages" category and not in the "Girls for Sex" category.
If you want to be displayed in the "Girls for Sex" category as well, log in to your account, click "ACCOUNT SETTINGS" and choose "EDIT PROFILE". Select the option "I WANT TO BE DISPLAYED ALSO IN THE SEX CATEGORY" and save the changes. You will then be visible in the "Girls for Sex" category, but with the label "MASSAGES ONLY".`,
  },
  {
    question: "Question No. 7: Forgot your login details?",
    answer: `If you forgot your password, simply click the "Log In" button on our website. In the new window, click the link "Forgot your password?".

Then just enter the username you registered with, or the email you used during registration. A new password will be sent to your email.

Note: You must enter the email you provided when registering on our website. If the email is not in our database, a new password cannot be sent. In that case, please contact us by email and we will send you new login details.`,
  },
  {
    question: "Question No. 8: How does boosting work?",
    answer: `Boosting on our website means your profile will be more visible in various categories depending on the number of assigned credits. When you decide to boost your profile that is, for example, in the category Sex Kiambu, and you set a daily limit of 100 credits, your profile will be placed first in that category every day, provided that no one adds more than 100 credits during the day.

Importantly, ordering is applied not only within counties but also across different categories and practices. If you have filled out profile information for multiple categories, your profile will have 100 credits in all of them on that day. If no one adds more credits, you will be placed first in each category.

The entire system is designed to be fair — whoever adds the most credits during a given day appears first in the relevant categories.`,
  },
  {
    question:
      "Question No. 9: I have credits available in my account — how do I use them for boosting?",
    answer: `Log in and click "ACCOUNT SETTINGS – EDIT PROFILE".
Your profile will be displayed; click the "BOOST LISTING" button.
Select the number of credits you want to add to the profile, then choose the duration for which you want your listing to be boosted.
Click "BOOST".
Credits will be deducted automatically and your listing will immediately appear higher. If no one in the given category has more credits, you will be in first place.

We recommend starting, for example, with 20 credits for 1 day to see how it works and where (how high) your listing appears.`,
  },
  {
    question: "Question No. 10: How do I purchase credits for boosting?",
    answer: `Log in to your account and click "ACCOUNT SETTINGS – BUY MORE CREDITS – FOR ADVERTISING AND BOOSTING".
Select the desired credit package.
After the payment is made and the variable symbol is entered correctly, the credits will be automatically added to your account within 40 minutes.
You can use the purchased credits both to extend advertising and to boost your profile.
If you have any questions or problems, please contact us at hello@kenyadesires.com.`,
  },
];

const page = () => {
  return (
    <article className="bg-white py-12 min-h-screen ">
      <div className="mx-16">
        <h4 className=" text-2xl font-semibold text-slate-800">
          Frequently asked questions
        </h4>
        <div className="mt-8 mx-auto">
          {faqs.map((faq, index) => (
            <FaqCard key={index} question={faq.question} answer={faq.answer} />
          ))}
        </div>
      </div>
    </article>
  );
};

export default page;
