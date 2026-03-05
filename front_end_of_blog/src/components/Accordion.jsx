import { useState } from 'react';
import './Accordion.css';

function AccordionItem({ question, answer, isOpen, onToggle }) {
  return (
    <div className={`accordion-item ${isOpen ? 'is-open' : ''}`}>
      <button className="accordion-header" onClick={onToggle}>
        <span className="accordion-question">{question}</span>
        <span className="accordion-icon">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points={isOpen ? "18 15 12 9 6 15" : "6 9 12 15 18 9"} />
          </svg>
        </span>
      </button>
      <div className="accordion-content">
        <div className="accordion-answer">{answer}</div>
      </div>
    </div>
  );
}

function Accordion({ items }) {
  const [openIndex, setOpenIndex] = useState(null);

  const handleToggle = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  if (!items || items.length === 0) {
    return null;
  }

  return (
    <div className="accordion">
      {items.map((item, index) => (
        <AccordionItem
          key={index}
          question={item.q}
          answer={item.a}
          isOpen={openIndex === index}
          onToggle={() => handleToggle(index)}
        />
      ))}
    </div>
  );
}

export default Accordion;
