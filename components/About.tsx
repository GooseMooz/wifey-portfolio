import { ensureImageVariant } from '@/lib/imageVariants'
import LoadableImage from './LoadableImage'

export default async function About() {
  const aboutSrc = await ensureImageVariant('/media/about.jpg', 'about-main')

  return (
    <section id="about" className="about">
      <div className="about-img-wrap fade-in">
        <div className="about-img-inner">
          <LoadableImage
            src={aboutSrc}
            alt="Cathy Luo"
            fill
            sizes="(max-width: 900px) 100vw, 50vw"
            priority
            style={{ objectFit: 'cover' }}
          />
        </div>
      </div>

      <div className="about-text fade-in">
        <p className="section-tag">a little about me</p>
        <h2>Hi, I&apos;m Cathy</h2>

        <p>
          I was born in a small rural town in Southern China from a family of teachers and farmers, but Vancouver has been my heart and home for the past 16 years. I have always been an artist, yet somewhere along the way of growing up, I broke my own heart and gave it up.
        </p>

        <p>
          Now, I am learning how to express my love for this world through photography. With the support of my husband as my muse (he also made this website), I am exploring new ways to capture the beauty of the people and places around me.
        </p>

        <p>
          I love: the strange, the otherworldly, the nostalgic, the melancholic, expressions of all kinds of human condition.
        </p>

        <p>
          I cherish the process of co-creating art, it is magical and different every single time! My job is helping you articulate who you are, what you want to say to the world, and understand how you want to be seen. I want to capture moments where you feel truly in your skin, living as a main character in a world that is your own.
        </p>

        <p>
          When I&apos;m not taking pictures I am usually contemplating existence, figuring out how to make our collective future more sustainable, and writing my reflections in my Substack.
        </p>

      </div>
    </section>
  )
}
