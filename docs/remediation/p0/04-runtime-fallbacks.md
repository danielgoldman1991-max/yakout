# Fallbacks runtime

`publicFallback` journalise désormais l’échec et lève `DATA_UNAVAILABLE`; il ne retourne plus sa fixture. Les loaders publics d’appartements utilisent la vue et aucun mock.

`DataResult<T>` distingue une lecture réussie vide d’un échec et masque le détail sensible. Risque résiduel : les signatures historiques ne sont pas toutes migrées et DATA-002 reste P1 ouvert.
