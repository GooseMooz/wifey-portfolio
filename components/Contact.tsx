import ContactForm from './ContactForm'

export default function Contact() {
  return (
    <section id="contact" className="contact">
      <div className="contact-header fade-in">
        <h2>Say hiiii! :3</h2>
        <p className="contact-blurb">
          Drop me a line — whether you have every detail planned
          or just a feeling. I&apos;ll get back within a day or two.
        </p>
      </div>

      <ContactForm />
    </section>
  )
}
