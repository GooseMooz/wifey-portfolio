import Nav from '@/components/Nav'
import Hero from '@/components/Hero'
import About from '@/components/About'
import Projects from '@/components/Projects'
import Rates from '@/components/Rates'
import Contact from '@/components/Contact'
import Footer from '@/components/Footer'
import { getAlbums } from '@/lib/albums'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const albums = await getAlbums()

  return (
    <>
      <Nav />
      <main>
        <Hero albums={albums} />
        <About />
        <Projects />
        <Rates />
        <Contact />
      </main>
      <Footer />
    </>
  )
}
