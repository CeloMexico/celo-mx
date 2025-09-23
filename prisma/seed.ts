import { PrismaClient } from '@prisma/client'
const p = new PrismaClient()
async function main(){
  const level = await p.level.upsert({ where:{ slug:'principiante' }, update:{}, create:{ slug:'principiante', name:'Principiante' }})
  const cat = await p.category.upsert({ where:{ slug:'celo' }, update:{}, create:{ slug:'celo', name:'Celo' }})
  const inst = await p.instructor.upsert({ where:{ id:'seed-inst-1' }, update:{}, create:{ id:'seed-inst-1', name:'Celo México', title:'Equipo Instructor' }})
  const course = await p.course.upsert({
    where:{ slug:'introduccion-a-celo' },
    update:{},
    create:{
      slug:'introduccion-a-celo',
      title:'Introducción a Celo',
      subtitle:'Primeros pasos en el ecosistema Celo.',
      levelId: level.id, categoryId: cat.id,
      isFree:true, visibility:'PUBLIC', status:'PUBLISHED',
      learners: 1200, rating: 4.8, ratingCount: 100
    }
  })
  await p.courseInstructor.upsert({ where:{ courseId_instructorId:{ courseId:course.id, instructorId:inst.id }}, update:{}, create:{ courseId:course.id, instructorId:inst.id, role:'Lead' }})
  const m1 = await p.module.create({ data:{ courseId:course.id, index:1, title:'Bienvenida', summary:'Setup rápido' }})
  await p.lesson.create({
    data:{
      moduleId:m1.id, index:1, title:'¿Qué es Celo?', summary:'Visión y casos',
      contentMdx: `# ¿Qué es Celo?
**Celo** es una cadena enfocada en impacto. 
- Stablecoins (cUSD, cEUR)
- MiniPay / Valora
- Ecosistema DeFi
`,
      status:'PUBLISHED', visibility:'PUBLIC'
    }
  })
  await p.lesson.create({
    data:{
      moduleId:m1.id, index:2, title:'Tu primera wallet', summary:'Onboarding',
      contentMdx: `## Tu primera wallet
Sigue estos pasos para crear y respaldar tu wallet. _Tip:_ prueba en testnet.`,
      status:'PUBLISHED', visibility:'PUBLIC'
    }
  })
}
main().then(()=>p.$disconnect()).catch(async e=>{ console.error(e); await p.$disconnect(); process.exit(1) })


