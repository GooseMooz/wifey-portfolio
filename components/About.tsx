import Image from 'next/image'

export default function About() {
  return (
    <section id="about" className="about">
      <div className="about-img-wrap fade-in">
        <div className="about-img-inner">
          <Image
            src="/photos/about.jpg"
            alt="Cathy Luo"
            fill
            sizes="(max-width: 900px) 100vw, 50vw"
            style={{ objectFit: 'cover' }}
          />
        </div>
      </div>

      <div className="about-text fade-in">
        <p className="section-tag">a little about me</p>
        <h2>Hi, I&apos;m Cathy</h2>

        <p>
          [Your bio goes here. Replace this with a personal introduction — who you are,
          where you&apos;re from, and what draws you to photography. Keep it warm and genuine,
          like you&apos;re talking to a friend over coffee.]
        </p>

        <p>
          [Second paragraph: your artistic approach or the kind of moments you love to capture.
          What do you look for? What kind of feeling do you want to leave people with?]
        </p>

        <p>
          [Optional third paragraph: something personal. A favourite thing, a fun fact,
          what you do when you&apos;re not behind the camera.]
        </p>

      </div>
    </section>
  )
}
