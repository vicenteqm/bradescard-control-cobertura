"""Lectura de la base y las pestañas semanales, sin modificar los originales."""
import calendar
import re
from pathlib import Path
import openpyxl
from pyxlsb import open_workbook

class Sheet:
    def __init__(self, rows): self.rows = rows
    def iter_rows(self, min_row=1, values_only=True): return iter(self.rows[min_row-1:])

class Book:
    def __init__(self, sheet): self.sheet = sheet
    def __getitem__(self, name): return self.sheet
    def close(self): pass

def load_base(path):
    book = openpyxl.load_workbook(path, read_only=True, data_only=True)
    try:
        rows = list(book['BASE BRADESCARD'].values)
    finally:
        book.close()
    rows[0] = tuple('REGION' if i == 3 else v for i, v in enumerate(rows[0]))
    return Book(Sheet(rows))

def load_attendance(path, period):
    from actualizar import norm, identifier
    year, month = map(int, period.split('-'))
    months = {'ENE':1,'FEB':2,'MAR':3,'ABR':4,'MAY':5,'JUN':6,'JUL':7,'AGO':8,'SEP':9,'OCT':10,'NOV':11,'DIC':12}
    max_day = calendar.monthrange(year, month)[1]
    header = ['SOCIO','DETERMINANTE','ESTATUS','PERFIL DE PUESTO BANCO','NUM DE NOMINA','NOMBRE COMPLETO']
    for d in range(1,max_day+1): header.extend([d,'Entr','Sal'])
    people = {}; latest = None; sheets = []
    with open_workbook(str(path)) as book:
        for name in book.sheets:
            if not name.startswith('ASISTENCIA DEL '): continue
            match = re.search(r'AL\s+(\d+)\s+(?:DE\s+)?([A-Z]{3})', norm(name))
            if not match: raise ValueError('Periodo semanal no reconocido: '+name)
            end_day, end_month = int(match[1]), months[match[2]]
            if end_month != month: continue
            sheets.append((end_day,name))
        if not sheets: raise ValueError('No hay pestañas semanales para el mes seleccionado')
        for end_day, name in sorted(sheets):
            with book.get_sheet(name) as sheet:
                rows = [[c.v for c in row] for row in sheet.rows()]
            hi = next((i for i,r in enumerate(rows[:10]) if 'NOMBRE COMPLETO' in [norm(v) for v in r]),None)
            if hi is None: raise ValueError('No se encontró encabezado: '+name)
            heads = {norm(v):i for i,v in enumerate(rows[hi])}
            fields = ['SOCIO','NUMERO DE TIENDA','ESTATUS','PERFIL DE PUESTO BANCO','NUM DE NOMINA','NOMBRE COMPLETO']
            if any(f not in heads for f in fields): raise ValueError('Faltan columnas en '+name)
            daycols = []
            # Un día mayor que el final semanal corresponde al mes anterior.
            for i,v in enumerate(rows[hi]):
                if isinstance(v,(int,float)) and 1 <= v <= end_day and int(v)==v:
                    if [norm(x) for x in rows[hi][i+1:i+3]] != ['ENTR','SAL']: raise ValueError('Día sin Entr y Sal')
                    daycols.append((i,int(v)))
            week_seen = {}
            for r in rows[hi+1:]:
                values = [r[heads[f]] for f in fields]
                if not values[5]: continue
                payroll = identifier(values[4]); person = (payroll if payroll!='PENDIENTE' else '',norm(values[5]))
                if person in week_seen:
                    if week_seen[person] != r: raise ValueError('Persona duplicada con datos distintos en '+name)
                    continue
                week_seen[person]=r
                record = people.setdefault(person, [None]*len(header))
                record[:6] = values
                for i,d in daycols:
                    dst=6+(d-1)*3
                    record[dst:dst+3]=r[i:i+3]
            latest = set(week_seen)
    # La plantilla activa se toma únicamente de la semana más reciente.
    for person,r in people.items():
        if person not in latest: r[2]='FUERA DE ULTIMA SEMANA'
    return Book(Sheet([header]+list(people.values())))
