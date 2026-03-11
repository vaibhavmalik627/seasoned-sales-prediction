import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const analyticsSlides = [
  {
    id: "forecast",
    eyebrow: "Forecast Analytics",
    title: "Convert forecast signals into inventory decisions.",
    body:
      "Forecast demand, inspect uncertainty, and plan replenishment from one operating view instead of switching between disconnected spreadsheets.",
    metrics: [
      { label: "MAPE accuracy", value: "8.4%" },
      { label: "Predicted demand", value: "1,240 units" },
      { label: "Inventory risk", value: "Medium" }
    ],
    route: "/forecast"
  },
  {
    id: "confidence",
    eyebrow: "Planning Confidence",
    title: "See the full range before you commit inventory.",
    body:
      "Confidence bands help teams plan around downside and upside demand scenarios, not just a single point estimate.",
    metrics: [
      { label: "Expected", value: "780" },
      { label: "Lower bound", value: "649" },
      { label: "Upper bound", value: "867" }
    ],
    route: "/confidence"
  },
  {
    id: "reorder",
    eyebrow: "Replenishment Planning",
    title: "Move directly from forecast to reorder action.",
    body:
      "Use safety stock, reorder point, and lead-time demand to decide what should be purchased next and where risk is accumulating.",
    metrics: [
      { label: "Reorder qty", value: "81" },
      { label: "Safety stock", value: "41" },
      { label: "Coverage days", value: "17" }
    ],
    route: "/reorder"
  }
];

const trustIndicators = [
  "Demand planning teams",
  "Inventory analysts",
  "Retail operations",
  "Supply chain planners",
  "Category managers"
];

const keyBenefits = [
  {
    icon: "FC",
    title: "Forecast Confidence",
    body: "Understand prediction reliability using confidence bands and backtesting metrics."
  },
  {
    icon: "IA",
    title: "Inventory Alignment",
    body: "Align supply, merchandising, and replenishment teams around one demand signal."
  },
  {
    icon: "MT",
    title: "Model Transparency",
    body: "Track forecast performance with MAPE, RMSE, MAE, and bias before acting."
  }
];

const workflowSteps = [
  {
    step: "01",
    title: "Upload historical sales data",
    body: "Load retail demand data from the dashboard and refresh the active planning dataset."
  },
  {
    step: "02",
    title: "Generate demand forecasts",
    body: "Run monthly projections by product, store, planning window, and holiday uplift."
  },
  {
    step: "03",
    title: "Evaluate forecast accuracy",
    body: "Backtest recent history to understand how dependable each forecast is."
  },
  {
    step: "04",
    title: "Plan reorder and safety stock",
    body: "Convert expected demand into reorder quantity, reorder point, and coverage decisions."
  }
];

const featureCards = [
  {
    icon: "DB",
    title: "Dashboard",
    route: "/dashboard",
    summary: "Monitor sales trends, model health, and the active dataset from one overview."
  },
  {
    icon: "FC",
    title: "Forecast",
    route: "/forecast",
    summary: "Generate demand predictions using item, store, seasonal timing, and holiday lift."
  },
  {
    icon: "CF",
    title: "Confidence",
    route: "/confidence",
    summary: "Review planning ranges before making purchasing or allocation decisions."
  },
  {
    icon: "RO",
    title: "Reorder",
    route: "/reorder",
    summary: "Turn demand signals into reorder quantities, safety stock, and service-level actions."
  },
  {
    icon: "RK",
    title: "Risk",
    route: "/risk",
    summary: "Identify stockout and overstock exposure across the current product portfolio."
  },
  {
    icon: "AC",
    title: "Accuracy",
    route: "/accuracy",
    summary: "Track MAPE, RMSE, MAE, and bias to evaluate forecast performance clearly."
  }
];

const useCases = [
  {
    title: "Retail Demand Planning",
    body: "Forecast seasonal product demand before peak months reshape purchasing and distribution decisions."
  },
  {
    title: "Inventory Optimization",
    body: "Determine reorder levels and safety stock using forecast ranges instead of static averages."
  },
  {
    title: "Supply Chain Coordination",
    body: "Keep logistics, merchandising, and store planning teams aligned on the same demand outlook."
  }
];

const faqs = [
  {
    question: "How accurate are the forecasts?",
    answer: "The platform exposes accuracy metrics such as MAPE, RMSE, MAE, and bias so teams can inspect reliability directly."
  },
  {
    question: "What data format is required?",
    answer: "The CSV upload flow is designed around retail sales records with date, store, item, and sales columns."
  },
  {
    question: "Does it support seasonal events or holidays?",
    answer: "Yes. Forecast and reorder workflows include holiday lift adjustments so planners can model event-driven demand shifts."
  }
];

const heroMessages = [
  "Predict Seasonal Demand.",
  "Optimize Inventory Decisions.",
  "Reduce Inventory Risk.",
  "Improve Forecast Accuracy."
];

function Home() {
  const { isAuthenticated } = useAuth();
  const [activeSlide, setActiveSlide] = useState(0);
  const [activeMessage, setActiveMessage] = useState(0);
  const [typedMessage, setTypedMessage] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % analyticsSlides.length);
    }, 4200);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const fullMessage = heroMessages[activeMessage];
    const isComplete = typedMessage === fullMessage;
    const isEmpty = typedMessage.length === 0;

    const timeout = window.setTimeout(() => {
      if (!isDeleting && !isComplete) {
        setTypedMessage(fullMessage.slice(0, typedMessage.length + 1));
        return;
      }

      if (!isDeleting && isComplete) {
        setIsDeleting(true);
        return;
      }

      if (isDeleting && !isEmpty) {
        setTypedMessage(fullMessage.slice(0, typedMessage.length - 1));
        return;
      }

      setIsDeleting(false);
      setActiveMessage((current) => (current + 1) % heroMessages.length);
    }, !isDeleting && isComplete ? 1400 : isDeleting ? 45 : 80);

    return () => window.clearTimeout(timeout);
  }, [activeMessage, isDeleting, typedMessage]);

  const currentSlide = analyticsSlides[activeSlide];
  const startPath = isAuthenticated ? "/forecast" : "/auth";
  const demoPath = isAuthenticated ? "/dashboard" : "/auth";

  return (
    <section className="b2b-home stack-xl">
      <header className="b2b-nav-shell">
        <div className="b2b-nav">
          <div className="b2b-nav-brand">
            <span className="b2b-brand-mark">SD</span>
            <div>
              <p>Seasonal Demand Forecasting Tool</p>
              <span>Retail demand intelligence</span>
            </div>
          </div>
          <nav className="b2b-nav-links">
            <a href="#features">Features</a>
            <a href="#workflow">Workflow</a>
            <a href="#use-cases">Use Cases</a>
            <a href="#faq">FAQ</a>
          </nav>
          <div className="b2b-nav-actions">
            <Link to={demoPath} className="b2b-nav-ghost">{isAuthenticated ? "View Demo" : "Store Login"}</Link>
            <Link to={startPath} className="b2b-nav-primary">{isAuthenticated ? "Start Forecasting" : "Create Account"}</Link>
          </div>
        </div>
      </header>

      <section className="b2b-hero">
        <p className="b2b-kicker">AI-Powered Demand Planning for Retail Teams</p>
        <h2>Seasonal Demand Forecasting Tool</h2>
        <p className="b2b-typewriter" aria-live="polite">
          <span>{typedMessage}</span>
          <span className="b2b-typewriter-cursor" aria-hidden="true" />
        </p>
        <p className="b2b-hero-copy">
          Forecast demand, evaluate prediction reliability, and optimize inventory planning using data-driven insights
          across forecasting, confidence, reorder, risk, and accuracy workflows.
        </p>
        <div className="b2b-hero-actions">
          <Link to={startPath} className="b2b-primary-link">{isAuthenticated ? "Start Forecasting" : "Create Account"}</Link>
          <Link to={demoPath} className="b2b-secondary-link">{isAuthenticated ? "View Demo" : "Store Login"}</Link>
        </div>
      </section>

      <section className="b2b-trust">
        <p className="b2b-trust-label">Trusted by demand planning functions</p>
        <div className="b2b-trust-grid">
          {trustIndicators.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
      </section>

      <section className="b2b-analytics" id="features">
        <div className="b2b-analytics-copy">
          <p className="b2b-kicker b2b-kicker-dark">{currentSlide.eyebrow}</p>
          <h3>{currentSlide.title}</h3>
          <p>{currentSlide.body}</p>
          <div className="b2b-hero-actions b2b-analytics-actions">
            <Link to={currentSlide.route} className="b2b-primary-link">Open Capability</Link>
            <button
              type="button"
              className="b2b-dark-ghost"
              onClick={() => setActiveSlide((current) => (current + 1) % analyticsSlides.length)}
            >
              Next View
            </button>
          </div>
          <div className="b2b-dots">
            {analyticsSlides.map((slide, index) => (
              <button
                key={slide.id}
                type="button"
                className={`b2b-dot ${index === activeSlide ? "active" : ""}`}
                onClick={() => setActiveSlide(index)}
                aria-label={`Show ${slide.eyebrow}`}
              />
            ))}
          </div>
        </div>

        <div className="b2b-analytics-visual" aria-hidden="true">
          <div className="b2b-visual-screen">
            <div className="b2b-chart-card">
              <p>Forecast timeline</p>
              <div className="b2b-chart-lines">
                <span className="line-a" />
                <span className="line-b" />
                <span className="line-c" />
              </div>
            </div>
            <div className="b2b-metric-cards">
              {currentSlide.metrics.map((metric) => (
                <article key={metric.label}>
                  <p>{metric.label}</p>
                  <h4>{metric.value}</h4>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="b2b-benefits">
        {keyBenefits.map((benefit) => (
          <article key={benefit.title} className="b2b-benefit-card">
            <span>{benefit.icon}</span>
            <h3>{benefit.title}</h3>
            <p>{benefit.body}</p>
          </article>
        ))}
      </section>

      <section className="b2b-section-head" id="workflow">
        <p className="b2b-kicker">Workflow</p>
        <h3>How the system moves from data to decisions.</h3>
      </section>

      <section className="b2b-workflow-grid">
        {workflowSteps.map((step) => (
          <article key={step.step} className="b2b-workflow-card">
            <p>{step.step}</p>
            <h4>{step.title}</h4>
            <span>{step.body}</span>
          </article>
        ))}
      </section>

      <section className="b2b-section-head">
        <p className="b2b-kicker">Core modules</p>
        <h3>Focused workflows for planning, analysis, and inventory control.</h3>
      </section>

      <section className="b2b-feature-grid">
        {featureCards.map((feature) => (
          <article key={feature.title} className="b2b-feature-card">
            <div className="b2b-feature-icon">{feature.icon}</div>
            <h4>{feature.title}</h4>
            <p>{feature.summary}</p>
            <Link to={feature.route}>Open {feature.title}</Link>
          </article>
        ))}
      </section>

      <section className="b2b-visualization">
        <div className="b2b-visualization-copy">
          <p className="b2b-kicker">Forecast visualization</p>
          <h3>Turn forecasting models into operational decision tools.</h3>
          <p>
            The interface combines historical sales, predicted demand, and confidence intervals so teams can evaluate
            forecasting performance at a glance.
          </p>
        </div>
        <div className="b2b-visualization-panels" aria-hidden="true">
          <article>
            <span>Historical Sales</span>
            <div className="mini-viz bars">
              <i />
              <i />
              <i />
              <i />
            </div>
            <p className="mini-viz-caption">Jan 120 | Feb 140 | Mar 190</p>
          </article>
          <article>
            <span>Predicted Demand</span>
            <div className="mini-viz trend">
              <i />
            </div>
            <p className="mini-viz-caption">Next month: 210 units</p>
          </article>
          <article>
            <span>Confidence Interval</span>
            <div className="mini-viz band">
              <i />
              <i />
            </div>
            <p className="mini-viz-caption">Range: 190 to 230 units</p>
          </article>
        </div>
      </section>

      <section className="b2b-section-head" id="use-cases">
        <p className="b2b-kicker">Use cases</p>
        <h3>Where retail teams use the platform.</h3>
      </section>

      <section className="b2b-use-case-grid">
        {useCases.map((useCase) => (
          <article key={useCase.title} className="b2b-use-case-card">
            <h4>{useCase.title}</h4>
            <p>{useCase.body}</p>
          </article>
        ))}
      </section>

      <section className="b2b-value-panel">
        <div>
          <p className="b2b-kicker b2b-kicker-dark">Why teams use this platform</p>
          <h3>Reduce stockouts. Improve forecast accuracy. Optimize reorder planning.</h3>
        </div>
        <div className="b2b-value-points">
          <span>Reduce stockouts</span>
          <span>Improve forecast accuracy</span>
          <span>Optimize reorder planning</span>
          <span>Align supply chain teams</span>
        </div>
      </section>

      <section className="b2b-section-head" id="faq">
        <p className="b2b-kicker">FAQ</p>
        <h3>Common questions from planning teams.</h3>
      </section>

      <section className="b2b-faq-grid">
        {faqs.map((faq) => (
          <article key={faq.question} className="b2b-faq-card">
            <h4>{faq.question}</h4>
            <p>{faq.answer}</p>
          </article>
        ))}
      </section>

      <section className="b2b-final-cta">
        <p className="b2b-kicker">Ready to see the workflow?</p>
        <h3>Start forecasting with a retail-first demand planning workspace.</h3>
        <div className="b2b-hero-actions">
          <Link to={startPath} className="b2b-primary-link">{isAuthenticated ? "Start Forecasting" : "Create Account"}</Link>
          <Link to={demoPath} className="b2b-secondary-link">{isAuthenticated ? "View Demo" : "Store Login"}</Link>
        </div>
      </section>
    </section>
  );
}

export default Home;
