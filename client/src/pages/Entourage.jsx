import "./Entourage.css";
import entourageBack from "../assets/entourage-back.png";
import BackButton from "./components/BackButton.jsx";

function Entourage() {
  return (
    <main
      className="entourage-page"
      style={{
        backgroundImage: `url(${entourageBack})`,
      }}
    >
      {/* BACK BUTTON */}
      <BackButton />

      <div className="entourage-overlay"></div>

      <section className="entourage-content">
        <h1 className="entourage-heading">
          Entourage
        </h1>

        <div className="entourage-list">
          <div className="entourage-group">
            <h2>Officiant</h2>
            <p>Pastor David Domingo Jr.</p>
          </div>

          <div className="entourage-group">
            <h2>Mother of the Groom</h2>
            <p>Mrs. Lerma de Dios</p>
          </div>

          <div className="entourage-group">
            <h2>Mother of the Bride and escort</h2>
            <p>Ms. Adelita Floro and Mr. Aries Elibado</p>
          </div>

          <div className="entourage-group">
            <h2>Aunt of the Bride</h2>
            <p>Mrs. Maria Theresa Gemoto</p>
          </div>

          <div className="entourage-group">
            <h2>Principal Sponsors</h2>

            <p>Mr. Ronaldo de Dios</p>
            <p>Mr. Jerry and Mrs. Maria Theresa Gemoto</p>
            <p>Mr. Pompio Jr. and Mrs. Angela Floro</p>
            <p>Pastor Romie and Pastora Lina Labayne</p>
            <p>Pastor Joshua and Mrs. Gie Sebastian</p>
            <p>Pastor Maurice and Pastora Ma. Joanne Grace Custodio</p>
            <p>Pastor David Jr. and Mrs. Thelma Domingo</p>
            <p>Mr. Ricardo and Mrs. Heidi Chua</p>
            <p>Mr. Byron and Mrs. Prescilla Buyoc</p>
            <p>Mr. Aris and Mrs. Cindy Rome</p>
            <p>Mrs. Josephine Casin</p>
            <p>Mr. Benjamin and Mrs. Evelyn Dato</p>
            <p>Mr. Dante Calualhatian</p>
            <p>Mrs. Elena Retamar</p>
            <p>Mr. Manny and Mrs. Monette Vertudazo</p>
            <p>Mr. Patrick John and Mrs. Maria Charisse Dela Cruz</p>
            <p>Engr. Pablo and Mrs. Rose Cañadido</p>
            <p>Mr. Roberto Eribal Jr.</p>
            <p>Mr. Adriano and Mrs Beverly Petacio</p>
            <p>Mrs. Ma. Zuzith Mingi</p>
          </div>

          <div className="entourage-group">
            <h2>Secondary Sponsors</h2>
          </div>

          <div className="entourage-group">
            <h2>Candle</h2>
            <p>Franco Polo Macasa</p>
            <p>Jan Chloe Pojas</p>
          </div>

          <div className="entourage-group">
            <h2>Cord</h2>
            <p>Vincent Sabong</p>
            <p>Ma. Angelica Sabong</p>
          </div>

          <div className="entourage-group">
            <h2>Veil</h2>
            <p>John Koby Reodica</p>
            <p>Benia Nicatte Cañadido</p>
          </div>

          <div className="entourage-group">
            <h2>Ring Bearer</h2>
            <p>Prince Jhamir Raagas</p>
          </div>

          <div className="entourage-group">
            <h2>Bible Bearer</h2>
            <p>Nevan Dela Cruz</p>
          </div>

          <div className="entourage-group">
            <h2>Coin Bearer</h2>
            <p>Mirakel Ellie de Dios</p>
          </div>

          <div className="entourage-group">
            <h2>Man of Honor and escort</h2>
            <p>Joshua Rhey Avanceña</p>
            <p>Reynaldo Avanceña</p>
          </div>

          <div className="entourage-group">
            <h2>Best Man</h2>
            <p>Paul David de Dios</p>
          </div>

          <div className="entourage-columns">
            <div className="entourage-column">
              <h2>Groomsmen</h2>

              <p>John Koby Reodica</p>
              <p>Franco Polo Macasa</p>
              <p>Jerry Brylle Gemoto</p>
              <p>Vincent Sabong</p>
              <p>Cholo Miguel Antonio</p>
              <p>Joshua Caleb Labayne</p>
            </div>

            <div className="entourage-column">
              <h2>Bridesmaids</h2>

              <p>Bence Cañadido</p>
              <p>Jan Chloe Pojas</p>
              <p>Rica Alcantara</p>
              <p>Ma. Angelica Sabong</p>
              <p>Hannah Lyne Pigao</p>
              <p>Joanna Aquino</p>
            </div>
          </div>

          <div className="entourage-group">
            <h2>Best Pup</h2>
            <p>Bugsy de Dios</p>
          </div>
        </div>
      </section>
    </main>
  );
}

export default Entourage;
