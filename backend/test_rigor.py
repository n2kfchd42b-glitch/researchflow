import sys
sys.path.insert(0, '.')
import pandas as pd
from app.analytics.ingestion import DataIngestionEngine
from app.analytics.statistics import StatisticsEngine
from app.analytics.rigor import RigorScoreEngine

df = pd.read_csv('../data/samples/health_dataset.csv')

ingestion = DataIngestionEngine()
df, quality_report = ingestion.ingest('../data/samples/health_dataset.csv')

stats = StatisticsEngine()
result = stats.logistic_regression(
    df, 'outcome', ['age','weight','treatment','sex']
)

rigor = RigorScoreEngine()
score = rigor.score(quality_report, result)

print(f'Overall Rigor Score: {score["overall_score"]}/100')
print(f'Grade: {score["grade"]}')
for key, val in score["breakdown"].items():
    print(f'  {key}: {val["score"]}/{val["max"]}')
for rec in score["recommendations"]:
    print(f'  - {rec}')
print('Rigor engine working correctly')