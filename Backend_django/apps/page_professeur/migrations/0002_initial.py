
import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('inscription_pedagogique', '0002_initial'),
        ('page_professeur', '0001_initial'),
        ('utilisateurs', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='affectationue',
            name='professeur',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='affectations', to='utilisateurs.professeur'),
        ),
        migrations.AddField(
            model_name='anonymat',
            name='annee_academique',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='inscription_pedagogique.anneeacademique'),
        ),
        migrations.AddField(
            model_name='anonymat',
            name='etudiant',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='anonymats', to='utilisateurs.etudiant'),
        ),
        migrations.AddField(
            model_name='article',
            name='professeur',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='utilisateurs.professeur'),
        ),
        migrations.AddField(
            model_name='encadrement',
            name='professeur',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='utilisateurs.professeur'),
        ),
        migrations.AddField(
            model_name='note',
            name='etudiant',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='notes', to='utilisateurs.etudiant'),
        ),
        migrations.AddField(
            model_name='note',
            name='evaluation',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='notes', to='page_professeur.evaluation'),
        ),
        migrations.AddField(
            model_name='periodesaisie',
            name='responsable',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='periodes_saisie', to='utilisateurs.responsablesaisienote'),
        ),
        migrations.AddField(
            model_name='projet',
            name='professeur',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='utilisateurs.professeur'),
        ),
        migrations.AddField(
            model_name='recherche',
            name='professeur',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='utilisateurs.professeur'),
        ),
        migrations.AddField(
            model_name='resultatue',
            name='etudiant',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='resultats_ues', to='utilisateurs.etudiant'),
        ),
        migrations.AddField(
            model_name='resultatue',
            name='inscription',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='resultats_ues', to='inscription_pedagogique.inscription'),
        ),
        migrations.AddField(
            model_name='ue',
            name='annee_etude',
            field=models.ManyToManyField(related_name='ues', to='inscription_pedagogique.anneeetude'),
        ),
        migrations.AddField(
            model_name='ue',
            name='filiere',
            field=models.ManyToManyField(related_name='ues', to='inscription_pedagogique.filiere'),
        ),
        migrations.AddField(
            model_name='ue',
            name='parcours',
            field=models.ManyToManyField(related_name='ues', to='inscription_pedagogique.parcours'),
        ),
        migrations.AddField(
            model_name='ue',
            name='semestre',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='ues', to='inscription_pedagogique.semestre'),
        ),
        migrations.AddField(
            model_name='ue',
            name='ues_composantes',
            field=models.ManyToManyField(blank=True, related_name='ue_parente', to='page_professeur.ue'),
        ),
        migrations.AddField(
            model_name='resultatue',
            name='ue',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='resultats', to='page_professeur.ue'),
        ),
        migrations.AddField(
            model_name='evaluation',
            name='ue',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='evaluations', to='page_professeur.ue'),
        ),
        migrations.AddField(
            model_name='anonymat',
            name='ue',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='anonymats', to='page_professeur.ue'),
        ),
        migrations.AddField(
            model_name='affectationue',
            name='ue',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='affectations', to='page_professeur.ue'),
        ),
        migrations.AlterUniqueTogether(
            name='resultatue',
            unique_together={('etudiant', 'ue', 'inscription')},
        ),
        migrations.AlterUniqueTogether(
            name='anonymat',
            unique_together={('etudiant', 'ue')},
        ),
    ]
