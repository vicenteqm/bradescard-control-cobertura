import unittest
from pathlib import Path
from unittest.mock import patch
import actualizar
from fuentes_bradescard import Book, Sheet, load_attendance

class Rules(unittest.TestCase):
    def test_exact_roles_and_gaps(self):
        base=Book(Sheet([['SOCIO','NUMERO DE TIENDA/DETERMINANTE','TIENDA','REGION','CIUDAD','ESTADO','ESTATUS','PROMOTORES REQUERIDOS','SUBLIDER'],['GCC',1,'T','R','C','E','OPERANDO',1,1]]))
        h=['SOCIO','DETERMINANTE','ESTATUS','PERFIL DE PUESTO BANCO','NUM DE NOMINA','NOMBRE COMPLETO',1,'Entr','Sal']
        roles=['PROMOTOR DE CREDITO','SUBLIDER','SUBLIDER 2','TEAM LEADER','SUBLIDER 20']
        attendance=Book(Sheet([h]+[['GCC',1,'ACTIVO',r,str(i),str(i),'A',None,None] for i,r in enumerate(roles)]))
        with patch.object(actualizar,'load_base',return_value=base),patch.object(actualizar,'load_attendance',return_value=attendance):
            r=actualizar.generate(Path('requirements.txt'),Path('README.md'),'2026-10')
        self.assertEqual(r['stores'][0]['active'],2)
        self.assertEqual(r['attendance'][0]['codes'],{'A':2})
        self.assertEqual(len(r['activeReview']),2)
        self.assertTrue(all(p['counted'] for p in r['activeReview']))

    def test_reconciliation_exclusions_and_baja(self):
        headers=['SOCIO','NUMERO DE TIENDA/DETERMINANTE','TIENDA','REGION','CIUDAD','ESTADO','ESTATUS','PROMOTORES REQUERIDOS','SUBLIDER']
        base=Book(Sheet([headers,['GCC',1,'Uno','R','C','E','OPERANDO',1,1],['GCC',2,'Dos','R','C','E','ENTREGADA',1,1]]))
        h=['SOCIO','DETERMINANTE','ESTATUS','PERFIL DE PUESTO BANCO','NUM DE NOMINA','NOMBRE COMPLETO',1,'Entr','Sal']
        records=[['GCC',1,'ACTIVO','SUBLIDER','1','Ana','A',None,None],['GCC',2,'ACTIVO','PROMOTOR','2','Bea','A',None,None],['GCC',3,'ACTIVO','PROMOTOR','3','Ceci','A',None,None],['GCC',1,'BAJA','PROMOTOR','4','Dani','A',None,None]]
        attendance=Book(Sheet([h]+records+[records[1]]))
        with patch.object(actualizar,'load_base',return_value=base),patch.object(actualizar,'load_attendance',return_value=attendance):
            r=actualizar.generate(Path('requirements.txt'),Path('README.md'),'2026-10')
        self.assertEqual(len(r['activeReview']),3)
        self.assertEqual(sum(p['counted'] for p in r['activeReview']),1)
        self.assertEqual([p['reason'] for p in r['activeReview'] if not p['counted']],['Tienda con estatus ENTREGADA','Sin tienda en la base'])
        self.assertEqual(r['attendance'][0]['codes'],{'A':1})
        self.assertNotIn('NUM DE NOMINA',str(r['activeReview']))

    def test_source_week_overlap_and_month_boundary(self):
        r=load_attendance(Path('inputs/ASISTENCIA BRADESCARD.xlsb'),'2026-10').sheet.rows
        self.assertEqual(len(r[0]),6+31*3)
        self.assertEqual(sum(x[2]=='ACTIVO' and actualizar.norm(x[3]) in ('PROMOTOR DE CREDITO','SUBLIDER') for x in r[1:]),25)
        self.assertTrue(all(not any(x[6+(d-1)*3:9+(d-1)*3]) for x in r[1:] for d in range(19,32)))

if __name__=='__main__': unittest.main()
