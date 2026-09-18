import json
from datetime import datetime, timedelta
from lunar_python import Solar

def calculate(raw):
    p = json.loads(raw)
    dt = datetime.fromisoformat(p['date'] + 'T' + p['time'])
    if not 1901 <= dt.year <= 2099:
        raise ValueError('请选择 1901—2099 年的出生日期')
    offset = float(p.get('offset', 8))
    if not -12 <= offset <= 14:
        raise ValueError('时区必须在 UTC−12 到 UTC+14 之间')
    sect = int(p.get('sect', 2))
    if sect not in (1, 2):
        raise ValueError('请选择有效的换日规则')
    # 所有四柱统一采用北京时间口径，节气时间同样为 UTC+8。
    bj = dt + timedelta(hours=8-offset-(1 if p.get('dst', False) else 0))
    solar = Solar.fromYmdHms(bj.year,bj.month,bj.day,bj.hour,bj.minute,bj.second)
    lunar = solar.getLunar()
    ec = lunar.getEightChar()
    ec.setSect(sect)
    pillars=[]
    for key in ['Year','Month','Day','Time']:
        get=lambda suffix: getattr(ec, 'get'+key+suffix)()
        pillars.append(dict(gz=get(''), wuxing=get('WuXing'), hidden=get('HideGan'),
            ganGod='日主' if key=='Day' else get('ShiShenGan'), zhiGod=get('ShiShenZhi'),
            nayin=get('NaYin'), stage=get('DiShi'), void=get('XunKong')))
    counts={x:0 for x in '木火土金水'}
    for pillar in pillars:
        for x in pillar['wuxing']: counts[x]+=1
    prev=lunar.getPrevJie()
    nxt=lunar.getNextJie()
    return json.dumps(dict(pillars=pillars, counts=counts, solar=solar.toYmdHms(),
        lunar=lunar.toString(), prev=prev.getName()+' '+prev.getSolar().toYmdHms(),
        next=nxt.getName()+' '+nxt.getSolar().toYmdHms(), sect=sect), ensure_ascii=False)
