import "./Faqs.css";

import entourageBack from "../assets/entourage-back.png";
import BackButton from "./components/BackButton.jsx";

const faqItems = [
  {
    question: "HOW SHOULD I RSVP?",
    answer:
      "To RSVP, please click the RSVP button here on our website and type in your name. All invited guests in your party will appear there so you can mark each guest as “going” or “not going”.",
  },
  {
    question: "WHEN IS THE RSVP DEADLINE?",
    answer: (
      <>
        Please RSVP by <strong>Sept 5, 2026.</strong> All RSVPs received after
        this date will be marked as not going; we will be sending our final
        headcount to our vendors following this deadline.
      </>
    ),
  },
  {
    question: "CAN I BRING A PLUS ONE?",
    answer:
      "Please refer to the number of seat/s allotted for you. As much as we want to celebrate with everybody, unfortunately, we can only accommodate a limited number of guests due to venue restrictions.",
  },
  {
    question: "CAN I BRING MY KID(S) WITH ME?",
    answer:
      "Children are really adorable but our event is an adult-only event. Only children who are part of the entourage are included in both the ceremony and reception.",
  },
  {
    question: "DO YOU HAVE ANY GIFT PREFERENCES?",
    answer:
      "As love is what this day is all about, your presence is one we couldn’t celebrate without. However, should you insist that a gift is worth giving, a monetary gift would be sincerely appreciated as we start our new life together.",
  },
  {
    question: "CAN I TAKE PICTURES?",
    answer:
      "We are having an “unplugged ceremony” (no phones or cameras). The greatest gift you can give us is being fully present as we say “I do”. We have hired professionals to capture this moment for us and we promise to share our photos as soon as we receive them. After the ceremony, feel free to take as many photos and videos as you’d like!",
  },
];

function Faqs() {
  return (
    <main
      className="faqs-page"
      style={{
        backgroundImage: `url(${entourageBack})`,
      }}
    >
      <BackButton />

      <div className="faqs-overlay" />

      <section className="faqs-content">
        <h1 className="faqs-heading">
          Faqs
        </h1>

        <div className="faqs-list">
          {faqItems.map((item, index) => (
            <div
              className="faqs-card"
              key={item.question}
              style={{
                animationDelay: `${0.42 + index * 0.12}s`,
              }}
            >
              <h2>{item.question}</h2>
              <p>{item.answer}</p>

              {index === 3 && (
                <div
                  className="faqs-divider"
                  aria-hidden="true"
                >
                  <span />
                  <span className="faqs-divider-symbol">
                    ❧
                  </span>
                  <span />
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

export default Faqs;
