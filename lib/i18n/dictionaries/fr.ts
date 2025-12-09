export const fr = {
  common: {
    actions: {
      save: 'Enregistrer',
      cancel: 'Annuler',
      backToHome: "Retour à l'accueil",
    },
    errors: {
      generic: 'Une erreur est survenue',
      notFound: '404 - Page Not Found',
    },
    server: {
      actions: {
        auth: {
          missingCreds: 'Email et mot de passe requis.',
          invalidCreds: 'Identifiants invalides.',
          unauthorized: 'Accès refusé. Permissions insuffisantes.',
          superAdminOnly:
            'Non autorisé : Seuls les SuperAdmins peuvent effectuer cette action.',
          validation: 'Données invalides.',
          successRegister: 'Admin enregistré avec succès.',
        },
        tournaments: {
          unauthorized: 'Non autorisé : Accès administrateur requis.',
          validationError: 'Erreur de validation',
          databaseError:
            'Erreur base de données : Une erreur inattendue est survenue.',
          createError:
            'Erreur base de données : Échec de la création du tournoi.',
          updateError:
            'Erreur base de données : Échec de la mise à jour du tournoi.',
          deleteError:
            'Erreur base de données : Échec de la suppression du tournoi.',
          duplicateSlug:
            'Un tournoi avec ce slug existe déjà. Veuillez en choisir un autre.',
          deleteSuccess: 'Tournoi supprimé avec succès.',
          notFound: 'Tournoi introuvable.',
          fieldDataConstraint: (label: string) =>
            `Impossible de supprimer le champ "${label}" car il contient des données utilisateur.`,
          fieldSecurityError: (id: string) =>
            `Erreur de sécurité : Le champ "${id}" n'appartient pas à ce tournoi.`,
        },
        admin: {
          unauthorized: 'Accès refusé.',
          notFound: 'Ressource introuvable.',
          updateSuccess: 'Mise à jour réussie.',
          deleteSuccess: 'Suppression réussie.',
          createSuccess: 'Création réussie.',
          successCreate: 'Admin créé avec succès.',
          successUpdate: 'Admin mis à jour avec succès.',
          successDelete: 'Admin supprimé avec succès.',
          successReset: 'Mot de passe réinitialisé avec succès.',
          operationUnauthorized: 'Opération non autorisée.',
          superAdminOnly:
            'Non autorisé : Seuls les SuperAdmins peuvent effectuer cette action.',
          protectedSuperAdmin:
            'Impossible de modifier ou supprimer un autre SuperAdmin.',
          userNotFound: 'Utilisateur introuvable.',
          emailExists: "Échec de la création. L'email existe peut-être déjà.",
          genericError:
            'Une erreur est survenue lors du traitement de votre demande.',
          validationError: 'Champs invalides fournis.',
        },
        settings: {
          success: 'Paramètres mis à jour avec succès.',
          uploadError: "Échec de l'upload du fichier logo.",
          validationError: 'Données invalides. Veuillez vérifier vos saisies.',
          dbError:
            'Erreur base de données : Échec de la sauvegarde des paramètres.',
        },
      },
      validations: {
        descriptionMin: 'La description doit contenir au moins 10 caractères',
        labelRequired: 'Le libellé est requis',
        slugMin: 'Le slug doit contenir au moins 3 caractères',
        streamUrlInvalid: "L'URL du stream est invalide",
        teamSizeMin: "La taille de l'équipe doit être d'au moins 1",
        titleMin: 'Le titre doit contenir au moins 3 caractères',
        emailInvalid: 'Adresse email invalide',
        nicknameRequired: 'Le pseudo est requis',
        playersMin: 'Au moins un joueur est requis',
      },
    },
    registration: {
      validationError: 'Veuillez corriger les erreurs dans le formulaire.',
      tournamentNotFound: 'Tournoi introuvable.',
      registrationClosed: 'Les inscriptions sont fermées.',
      emailAlreadyUsed: 'Cet email est déjà utilisé pour ce tournoi.',
      tournamentFull: 'Le tournoi est complet.',
      failed: "Échec de l'inscription.",
      successWaitlist:
        "Inscription réussie ! Vous avez été placé sur la liste d'attente.",
      successApproved: 'Inscription réussie !',
      cancelNotFound: 'Inscription introuvable.',
      cancelInvalidToken: "Jeton d'annulation invalide.",
      cancelSuccess: 'Inscription annulée avec succès.',
      cancelFailed: "Échec de l'annulation de l'inscription.",
      fieldMissing: (label: string, nickname: string) =>
        `Champ requis manquant : ${label} pour le joueur ${nickname}`,
    },
    email: {
      subjectPrefix: 'Inscription reçue - ',
      registrationReceived: {
        title: 'Inscription Reçue',
        thankYou: (title: string) =>
          `Merci de vous être inscrit au tournoi <strong>${title}</strong>.`,
        currentStatus: (status: string) =>
          `Votre statut actuel est : <strong>${status}</strong>.`,
        notification:
          'Nous vous notifierons en cas de changement de votre statut.',
        cancelLinkText: "Annuler l'inscription",
        cancelText:
          'Si vous souhaitez annuler votre inscription, cliquez sur le lien ci-dessous :',
        closing: 'Cordialement,',
        teamName: "L'équipe Belouga Tournament",
      },
      statusUpdate: {
        title: "Mise à jour du statut d'inscription",
        content: (title: string) =>
          `Votre statut pour le tournoi <strong>${title}</strong> a été mis à jour.`,
        newStatus: (status: string) =>
          `Nouveau statut : <strong>${status}</strong>`,
      },
      errorSend: "Échec de l'envoi de l'email via Resend.",
    },
  },
  layout: {
    sidebar: {
      brandName: 'BELOUGA',
      menuLabel: 'Menu',
      connectedAs: 'Connecté en tant que',
      links: {
        dashboard: 'Tableau de bord',
        tournaments: 'Tournois',
        admins: 'Administrateurs',
        settings: 'Paramètres',
      },
    },
    navbar: {
      links: {
        home: 'Accueil',
        tournaments: 'Tournois',
        stream: 'Stream',
        contact: 'Contact',
      },
    },
    footer: {
      description:
        'La plateforme de référence pour les tournois e-sport amateurs.',
      rightsReserved: 'Tous droits réservés.',
      developedBy: 'Développé par',
      links: {
        privacy: 'Politique de confidentialité',
        terms: "Conditions d'utilisation",
        tournaments: {
          title: 'Tournois',
          upcoming: 'Prochains',
          archive: 'Archives',
          rules: 'Règlement',
        },
        community: {
          title: 'Communauté',
          stream: 'Stream',
          discord: 'Discord',
        },
        support: {
          title: 'Support',
          contact: 'Contact',
          admin: 'Administration',
          legal: 'Mentions Légales',
        },
      },
    },
  },
  pages: {
    // Re-added pages wrapper properly if lost, or assuming it exists. I need to be careful with structure.
    // ...
    home: {
      metaTitle: 'Belouga Tournament',
      metaDescription: 'Les tournois Belouga créés par Quentadoulive.',
      hero: {
        badge: 'La référence e-sport amateur',
        title: 'BELOUGA',
        titleGradient: 'TOURNAMENT',
        description:
          "Rejoignez la compétition ultime. Tournois, communauté et diffusion en direct pour les passionnés d'e-sport.",
        descriptionHighlight: 'Votre gloire commence ici.',
        primaryCta: 'Participer',
        secondaryCta: 'En savoir plus',
      },
      features: {
        title: 'Pourquoi nous rejoindre ?',
        subtitle:
          'Une expérience compétitive conçue par des joueurs, pour des joueurs.',
        items: {
          fairPlay: {
            title: 'Compétition Fair-play',
            description:
              'Un règlement strict et une modération active pour garantir des parties saines et équitables.',
          },
          proFormat: {
            title: 'Format Professionnel',
            description:
              'Des arbres de tournois clairs, des horaires respectés et une organisation sans faille.',
          },
          liveStream: {
            title: 'Diffusion Live',
            description:
              'Vos exploits commentés en direct sur Twitch pour une expérience e-sport immersive.',
          },
        },
      },
      stats: {
        labels: {
          years: "Années d'existence",
          players: 'Joueurs Inscrits',
          tournaments: 'Tournois Organisés',
          matches: 'Matchs Joués',
        },
      },
      stream: {
        badge: 'EN DIRECT',
        title: "Suivez l'action",
        description:
          'Ne manquez aucun moment fort. Retrouvez les meilleurs matchs commentés en direct sur notre chaîne Twitch.',
        loading: 'Chargement du stream...',
      },
      sponsors: {
        title: 'Ils nous font confiance',
        subtitle:
          "Ils soutiennent l'e-sport amateur et rendent cette aventure possible.",
        cta: {
          text: 'Vous souhaitez devenir partenaire ?',
          link: 'Contactez-nous',
        },
        partners: {
          platinum: {
            name: 'Sponsor Principal',
            description: 'Partenaire officiel du Belouga Tournament.',
          },
          gold: {
            name: 'Partenaire Tech',
            description: 'Fournisseur de serveurs haute performance.',
          },
          silver: {
            name: 'Soutien Communautaire',
            description: 'Aide au développement de la scène locale.',
          },
        },
      },
    },
    login: {
      title: 'Connexion Admin',
      subtitle: 'Accès réservé aux administrateurs',
      social: {
        discord: 'Se connecter avec Discord',
        error: 'Erreur lors de la connexion',
      },
    },
    tournamentsArchive: {
      metaTitle: 'Archives des Tournois',
      metaDescription:
        "Consultez l'historique et les résultats des tournois Belouga passés.",
      title: 'Tournois archivés',
      subtitle: 'Explorez les tournois passés et leurs résultats.',
      empty: {
        title: 'Aucune archive',
        desc: 'Aucun tournoi archivé trouvé pour le moment.',
      },
      btnBack: 'Retour aux tournois',
    },
    tournaments: {
      list: {
        // existing
        title: 'Prochains Tournois',
        description:
          'Découvrez les prochaines compétitions, inscrivez-vous et préparez-vous à affronter les meilleurs joueurs.',
        btnArchive: 'Voir les archives',
        empty: {
          title: 'Aucun tournoi prévu',
          desc: 'Revenez plus tard pour découvrir les prochaines compétitions !',
        },
      },
      detail: {
        metadata: {
          notFound: 'Tournoi introuvable',
          titleTemplate: (title: string) => `${title}`,
        },
        buttons: {
          back: 'Retour aux tournois',
          joinDiscord: 'Rejoindre le Discord',
        },
        labels: {
          format: 'Format',
          maxParticipants: (max: number, format: 'TEAM' | 'PLAYER') =>
            `Max ${max} ${format === 'TEAM' ? 'Équipes' : 'Joueurs'}`,
          unlimited: 'Places illimitées',
        },
        tabs: {
          details: 'Détails',
          bracket: 'Bracket',
          stream: 'Live',
        },
        sections: {
          about: 'À propos du tournoi',
          registration: 'Inscription',
          help: "Besoin d'aide ?",
        },
        help: {
          desc: 'Rejoignez notre Discord pour contacter les administrateurs du tournoi.',
        },
        bracket: {
          emptyTitle: 'Bracket non disponible',
          emptyDesc: "Le bracket du tournoi n'a pas encore été publié.",
          titleIframe: 'Bracket du tournoi',
        },
        stream: {
          emptyTitle: 'Stream hors ligne',
          emptyDesc:
            "Aucun stream n'est configuré pour ce tournoi pour le moment.",
          titleIframe: 'Stream en direct',
        },
        registration: {
          closedTitle: 'Inscriptions fermées',
          closesOnPrefix: 'Les inscriptions ferment le ',
          opensOn: (date: string) => `Ouverture le ${date}`,
          ended: "La période d'inscription est terminée.",
        },
      },
    },
    unauthorized: {
      title: 'Accès Restreint',
      description:
        "Votre compte a été créé avec succès, mais vous n'avez pas les droits nécessaires pour accéder au tableau de bord.",
      messages: {
        restricted:
          "L'accès à l'administration est réservé aux administrateurs approuvés.",
        contact:
          "Si vous pensez qu'il s'agit d'une erreur, veuillez contacter un super-administrateur pour qu'il active votre compte.",
      },
    },
    admin: {
      dashboard: {
        title: 'Tableau de bord',
        subtitle: "Vue d'ensemble de votre plateforme de tournois.",
        btnNewTournament: 'Créer un Tournoi',
        sectionActivity: 'Activité Récente',
        sectionActions: 'Actions Rapides',
        emptyActivity: 'Aucune activité récente.',
        locked: 'Réservé aux SuperAdmins',
        stats: {
          active: 'Tournois Actifs',
          pending: 'Inscriptions en attente',
          participants: 'Total Participants',
          admins: 'Total Administrateurs',
        },
        badges: {
          approved: 'APPROUVÉ',
          pending: 'EN ATTENTE',
          rejected: 'REFUSÉ',
        },
        actions: {
          manageTournaments: 'Gérer les Tournois',
          manageTournamentsDesc: 'Créer, modifier et gérer',
          manageAdmins: 'Gérer les Admins',
          manageAdminsDesc: 'Comptes et accès',
          siteSettings: 'Paramètres du Site',
          siteSettingsDesc: 'Configuration globale',
          view: 'Voir',
        },
        registeredTo: 'Inscrit au tournoi',
        ofTotal: 'Sur {total} tournois au total',
        approvedCount: 'Approuvées',
        uniquePlayers: 'Joueurs uniques',
        siteManagers: 'Gestionnaires du site',
      },
      tournaments: {
        list: {
          title: 'Tournois',
          subtitle:
            'Gérez vos événements compétitifs et vos arbres de tournoi.',
          createButton: 'Créer un Tournoi',
          tableHeaders: {
            title: 'Titre',
            date: 'Date',
            format: 'Format',
            registrations: 'Inscrits',
            actions: 'Actions',
          },
          badges: {
            finished: 'Terminé',
            private: 'Privé',
            public: 'Public',
          },
          emptyState: {
            message: 'Aucun tournoi trouvé.',
            cta: 'Créer votre premier tournoi',
          },
        },
        detail: {
          subtitle:
            "Gérez les inscriptions, l'intégration des brackets et les paramètres du tournoi.",
          buttons: {
            edit: 'Modifier le Tournoi',
            approve: 'Approuver',
            reject: 'Refuser',
          },
          tabs: {
            overview: "Vue d'ensemble",
            registrants: (count: number) => `Inscrits (${count})`,
          },
          cards: {
            fillRate: { title: 'Remplissage', participants: 'participants' },
            format: { title: 'Format', subtitle: 'Structure du tournoi' },
            date: { title: 'Date', subtitle: 'Date de début' },
            challonge: {
              title: 'Intégration Challonge',
              description:
                "Entrez l'ID du tournoi Challonge pour intégrer l'arbre sur la page publique.",
            },
          },
          table: {
            name: 'Nom',
            contact: 'Contact',
            status: 'Statut',
            date: 'Date',
            actions: 'Actions',
            empty: 'Aucune inscription pour le moment.',
            statusLabels: {
              approved: 'APPROUVÉ',
              pending: 'EN ATTENTE',
              rejected: 'REFUSÉ',
            },
          },
          sheet: {
            title: "Détails de l'inscription",
            unknownField: 'Champ Inconnu',
            unknownTeam: 'Inconnu',
            playersCount: (count: number) => `(${count} joueurs)`,
          },
          visibility: {
            public: 'Public',
            private: 'Privé',
            errorUpdate: 'Erreur lors de la mise à jour',
            toastSuccess: 'Visibilité mise à jour',
          },
          csv: {
            exportBtn: 'Export CSV',
            success: 'Export réussi !',
            errorGeneric: "Échec de l'export des données.",
            errorNoData: 'Aucune donnée à exporter.',
          },
          delete: {
            title: 'Êtes-vous absolument sûr ?',
            description:
              'Cette action est irréversible. Cela supprimera définitivement le tournoi et toutes les données associées (inscriptions, matchs).',
            btnCancel: 'Annuler',
            btnDelete: 'Supprimer',
            btnDeleting: 'Suppression...',
          },
        },
        form: {
          createTitle: 'Créer un Tournoi',
          createSubtitle:
            'Configurez les détails et les règles de votre nouveau tournoi.',
          createSubmit: 'Créer le Tournoi',
          editTitle: 'Modifier',
          editSubtitle: 'Modifier le tournoi',
          sections: {
            general: {
              title: 'Informations Générales',
              description: 'Détails de base du tournoi.',
              labels: {
                title: 'Titre',
                slug: 'Slug (URL)',
                description: 'Description',
              },
              placeholders: {
                title: 'Belouga Cup #1',
                slug: 'belouga-cup-1',
                description: 'Règles et détails du tournoi...',
              },
            },
            dates: {
              title: 'Dates & Horaires',
              description: 'Planification du tournoi et des inscriptions.',
              labels: {
                startDate: 'Date de début',
                endDate: 'Date de fin',
                registrationOpen: 'Ouverture des inscriptions',
                registrationClose: 'Fermeture des inscriptions',
              },
              placeholder: 'Choisir une date',
            },
            settings: {
              title: 'Format & Configuration',
              description: 'Structure et limites du tournoi.',
              labels: {
                format: 'Format',
                teamSize: "Taille de l'équipe",
                maxParticipants: 'Participants Max',
              },
              placeholders: {
                format: 'Sélectionner le format',
              },
              options: {
                solo: 'Solo',
                team: 'Équipe',
              },
            },
            customFields: {
              title: "Champs d'Inscription",
              description:
                "Définissez des champs dynamiques pour l'inscription des joueurs.",
              addButton: 'Ajouter un champ',
              empty: 'Aucun champ personnalisé ajouté.',
              labels: {
                label: 'Label',
                type: 'Type',
                required: 'Requis',
              },
              placeholders: {
                label: 'ex: Rang, Pseudo Discord...',
              },
              options: {
                text: 'Texte',
                number: 'Nombre',
              },
            },
          },
        },
      },
      admins: {
        title: 'Administrateurs',
        subtitle: 'Gestion des comptes et des permissions.',
        accessDenied: {
          title: 'Accès Refusé',
          description:
            'Cette page est strictement réservée aux Super Administrateurs.',
          back: 'Retour au tableau de bord',
        },
        manager: {
          title: 'Liste des Utilisateurs',
          subtitle:
            'Gérez les accès administrateurs et les demandes en attente.',
          buttons: {
            add: 'Ajouter un administrateur',
            create: 'Créer le compte',
            creating: 'Création...',
            cancel: 'Annuler',
            confirm: 'Confirmer',
            modifying: 'Modification...',
          },
          dialog: {
            title: 'Nouvel Administrateur',
            description:
              'Créez un nouveau compte administrateur. Ils auront accès au tableau de bord.',
          },
          labels: {
            email: 'Email',
          },
          placeholders: {
            email: 'admin@exemple.com',
          },
          table: {
            headers: {
              email: 'Email',
              role: 'Rôle',
              date: 'Date de création',
              actions: 'Actions',
            },
            actions: {
              delete: 'Supprimer',
              promote: 'Promouvoir Admin',
            },
            confirm: {
              delete: 'Êtes-vous sûr de vouloir supprimer cet utilisateur ?',
              promote:
                "Voulez-vous promouvoir cet utilisateur en tant qu'administrateur ?",
            },
          },
          roles: {
            user: 'Utilisateur',
            admin: 'Administrateur',
            superadmin: 'Super Admin',
          },
          toasts: {
            deleteSuccess: 'Utilisateur supprimé',
            promoteSuccess: 'Utilisateur promu administrateur',
          },
        },
      },
      settings: {
        title: 'Paramètres',
        subtitle: 'Configuration globale du site et liens sociaux.',
        accessDenied: {
          title: 'Accès Refusé',
          description:
            'Cette page est strictement réservée aux Super Administrateurs.',
          back: 'Retour au tableau de bord',
        },
        form: {
          sections: {
            general: {
              title: 'Général',
              description: 'Configuration de base du site web.',
              labels: {
                logo: 'Logo du site',
              },
              buttons: {
                upload: 'Choisir un fichier',
              },
              hints: {
                format: 'Format accepté : PNG, JPG.',
              },
            },
            social: {
              title: 'Réseaux Sociaux',
              description:
                'Liens vers vos profils sociaux affichés dans le pied de page.',
            },
            stats: {
              title: 'Statistiques',
              description: "Chiffres clés affichés sur la page d'accueil.",
              labels: {
                years: "Années d'existence",
                players: 'Joueurs Inscrits',
                tournaments: 'Tournois Organisés',
                matches: 'Matchs Joués',
              },
              placeholders: {
                years: 'ex: 2+',
                players: 'ex: 500+',
                tournaments: 'ex: 50+',
                matches: 'ex: 1.2k+',
              },
            },
          },
          buttons: {
            save: 'Enregistrer',
            saving: 'Enregistrement...',
          },
        },
      },
      registration: {
        table: {
          headers: {
            teamPlayer: 'Équipe / Joueur',
            email: 'Email de contact',
            status: 'Statut',
            createdAt: "Date d'inscription",
            actions: 'Actions',
          },
          noData: 'Aucune inscription trouvée.',
          playersCount: (count: number) => `(${count} joueurs)`,
          unknownName: 'Inconnu',
          actions: {
            label: 'Actions',
            approve: 'Approuver',
            waitlist: "Liste d'attente",
            reject: 'Rejeter',
          },
          toasts: {
            approveSuccess: 'Inscription approuvée',
            waitlistSuccess: "Déplacé en liste d'attente",
            rejectSuccess: 'Inscription rejetée',
            actionFailed: "L'action a échoué",
          },
        },
        errors: {
          teamNameRequired: "Le nom d'équipe est requis",
          emailInvalid: 'Adresse email invalide',
          nicknameMin: 'Le pseudo doit contenir au moins 2 caractères',
          fieldRequired: (label: string) => `${label} est requis`,
          numberRequired: 'Doit être un nombre',
        },
        labels: {
          teamName: "Nom de l'équipe",
          contactEmail: 'Email de contact',
          playersSection: 'Composition',
          playerDetails: 'Détails du joueur',
          addPlayer: 'Ajouter un joueur',
          player: 'Joueur',
          nickname: 'Pseudo',
          submit: "Confirmer l'inscription",
          submitting: 'Inscription en cours...',
          teamInfoTitle: "Informations de l'équipe",
          playerInfoTitle: 'Informations du joueur',
        },
        placeholders: {
          teamName: 'Ex: Les Champions',
          email: 'email@exemple.com',
          nickname: 'Pseudo en jeu',
          select: 'Sélectionner...',
        },
      },
      actions: {
        csv: {
          exportBtn: 'Export CSV',
          success: 'Export réussi !',
          errorGeneric: "Échec de l'export des données.",
          errorNoData: 'Aucune donnée à exporter.',
        },
        delete: {
          title: 'Êtes-vous absolument sûr ?',
          description:
            'Cette action est irréversible. Cela supprimera définitivement le tournoi et toutes les données associées (inscriptions, matchs).',
          btnCancel: 'Annuler',
          btnDelete: 'Supprimer',
          btnDeleting: 'Suppression...',
        },
        visibility: {
          public: 'Public',
          private: 'Privé',
          errorUpdate: 'Erreur lors de la mise à jour',
          toastSuccess: 'Visibilité mise à jour',
        },
      },
    },
    stream: {
      title: 'Stream Twitch',
      description:
        "Regardez la compétition en direct sur Twitch, n'oubliez pas de vous abonner à la chaîne pour être informé des prochains tournois.",
      metaTitle: 'Stream En Direct',
      metaDescription: 'Suivez les tournois Belouga en direct sur Twitch.',
    },
    cancelRegistration: {
      errors: {
        invalidRequest: {
          title: 'Requête Invalide',
          description:
            "L'identifiant d'inscription ou le jeton de sécurité est manquant.",
        },
        invalidLink: {
          title: 'Lien Expiré ou Invalide',
          description:
            "Ce lien d'annulation n'est plus valide. Votre inscription a peut-être déjà été annulée.",
        },
      },
      confirm: {
        title: "Annuler l'inscription",
        description: (tournamentName: string) =>
          `Êtes-vous sûr de vouloir annuler votre inscription pour le tournoi "${tournamentName}" ?`,
        warning:
          "Cette action est irréversible. En annulant, vous perdrez définitivement votre place dans le tournoi (ou la liste d'attente).",
      },
      buttons: {
        home: "Retour à l'accueil",
        keep: 'Non, garder ma place',
        confirm: "Oui, annuler l'inscription",
      },
    },
    contact: {
      title: 'Contactez-nous',
      description:
        "Une question ? Une proposition ? N'hésitez pas à nous contacter via les canaux ci-dessous.",
      cards: {
        email: {
          title: 'Support Email',
          desc: 'Pour toute demande générale ou administrative.',
          btnLabel: 'Envoyer un email',
        },
        discord: {
          title: 'Communauté Discord',
          desc: 'Rejoignez la communauté pour discuter en direct.',
          btnLabel: 'Rejoindre le Discord',
        },
        twitch: {
          title: 'Chaîne Twitch',
          desc: 'Regardez nos tournois en direct.',
          btnLabel: 'Voir le live',
        },
        youtube: {
          title: 'Chaîne YouTube',
          desc: 'Regardez les replays des tournois et les best of.',
          btnLabel: 'Voir le live',
        },
        instagram: {
          title: 'Chaîne Instagram',
          desc: 'Venez nous suivre pour être informé des tournois et des news.',
          btnLabel: 'Voir le live',
        },
        tiktok: {
          title: 'Chaîne TikTok',
          desc: 'Venez nous suivre pour être informé des tournois et des news.',
          btnLabel: 'Voir le live',
        },
      },
    },
    legal: {
      metaTitle: 'Mentions Légales',
      metaDescription: 'Mentions légales et informations sur l’éditeur.',
      title: 'Mentions Légales',
      description:
        "Informations légales concernant l'éditeur et l'hébergement du site.",
      sections: {
        editor: {
          title: 'Éditeur du Site',
          content:
            'Le site Belouga Tournament est édité à titre personnel. Pour toute question ou réclamation, vous pouvez nous contacter via le formulaire de contact disponible sur la plateforme.',
        },
        hosting: {
          title: 'Hébergement',
          contentPrefix:
            'Ce site est hébergé par Vercel Inc., dont le siège social est situé au :',
          address: [
            'Vercel Inc.',
            '340 S Lemon Ave #4133',
            'Walnut, CA 91789',
            'États-Unis',
          ],
        },
        intellectualProperty: {
          title: 'Propriété Intellectuelle',
          content:
            "L'ensemble de ce site relève de la législation française et internationale sur le droit d'auteur et la propriété intellectuelle. Tous les droits de reproduction sont réservés, y compris pour les documents téléchargeables et les représentations iconographiques et photographiques.",
        },
        content: {
          title: 'Contenu',
          content:
            "La reproduction de tout ou partie de ce site sur un support électronique quel qu'il soit est formellement interdite sauf autorisation expresse du directeur de la publication.",
        },
      },
    },
    privacy: {
      metaTitle: 'Politique de Confidentialité',
      metaDescription:
        'Informations sur la collecte et l’utilisation de vos données.',
      title: 'Politique de Confidentialité',
      description:
        'Nous accordons une importance primordiale à la confidentialité et à la sécurité de vos données personnelles.',
      sections: {
        collection: {
          title: 'Collecte des Données',
          intro:
            "Dans le cadre de l'utilisation de la plateforme, nous sommes amenés à collecter certaines données personnelles nécessaires au bon fonctionnement du service :",
          list: [
            'Informations de compte : Pseudo, adresse email, identifiants (Discord, etc.).',
            'Données de connexion : Adresse IP, type de navigateur.',
            'Données de participation : Historique des tournois, résultats.',
          ],
        },
        usage: {
          title: 'Utilisation des Données',
          intro: 'Vos données sont utilisées exclusivement pour :',
          list: [
            'Gérer votre compte et vérifier votre identité.',
            'Organiser les tournois et communiquer avec vous.',
            "Améliorer la sécurité et l'expérience utilisateur de la plateforme.",
            'Verser les récompenses aux gagnants.',
          ],
          outro:
            'Nous ne vendons ni ne louons vos données personnelles à des tiers.',
        },
        rights: {
          title: 'Vos Droits',
          content:
            "Conformément au RGPD, vous disposez d'un droit d'accès, de rectification, d'effacement et de portabilité de vos données. Vous pouvez exercer ces droits en nous contactant via le support.",
        },
        cookies: {
          title: 'Cookies',
          content:
            "Le site utilise des cookies essentiels au fonctionnement (session) et, avec votre consentement, des cookies d'analyse pour mesurer l'audience et améliorer nos services.",
        },
      },
    },
    terms: {
      metaTitle: "Conditions Générales d'Utilisation",
      metaDescription:
        "Conditions régissant l'utilisation de la plateforme Belouga Tournament.",
      title: 'Conditions Générales',
      description:
        "En accédant à ce site, vous acceptez les présentes conditions générales d'utilisation.",
      sections: {
        object: {
          title: 'Objet',
          content:
            "Les présentes Conditions Générales d'Utilisation (CGU) ont pour objet de définir les modalités de mise à disposition des services du site Belouga Tournament et les conditions d'utilisation du service par l'Utilisateur.",
        },
        access: {
          title: 'Accès au Service',
          content:
            "Le service est accessible gratuitement à tout Utilisateur disposant d'un accès à internet. Tous les coûts afférents à l'accès au service, que ce soient les frais matériels, logiciels ou d'accès à internet sont exclusivement à la charge de l'Utilisateur.",
        },
        account: {
          title: 'Compte Utilisateur',
          content:
            "L'Utilisateur est responsable du maintien de la confidentialité de ses identifiants de connexion. Toute action effectuée via son compte est réputée avoir été effectuée par lui-même.",
        },
        liability: {
          title: 'Responsabilité',
          content:
            "Les informations diffusées sur le site sont présentées à titre informatif. L'éditeur ne peut être tenu responsable de l'utilisation faite des informations présentes sur le site, ni de tout préjudice direct ou indirect pouvant en découler.",
        },
        intellectualProperty: {
          title: 'Propriété Intellectuelle',
          content:
            "Les marques, logos, signes ainsi que tout le contenu du site (textes, images, son...) font l'objet d'une protection par le Code de la propriété intellectuelle et plus particulièrement par le droit d'auteur.",
        },
        law: {
          title: 'Droit Applicable',
          content:
            "Les présentes CGU sont soumises au droit français. En cas de litige non résolu à l'amiable, les tribunaux français seront seuls compétents.",
        },
      },
    },
    rules: {
      metaTitle: 'Règlement',
      metaDescription: 'Règlement officiel des tournois Belouga.',
      title: 'Règlement',
      description:
        'Règlement officiel régissant tous les tournois organisés sur la plateforme.',
      sections: {
        participation: {
          title: 'Conditions de Participation',
          intro:
            "La participation aux tournois est ouverte à tous les joueurs respectant les critères d'éligibilité définis pour chaque événement. Chaque joueur doit posséder un compte valide et être en règle avec les conditions d'utilisation de la plateforme.",
          list: [
            'Avoir un compte vérifié.',
            "Respecter l'âge minimum requis (si applicable).",
            "Ne pas être sous le coup d'une suspension active.",
          ],
        },
        matches: {
          title: 'Déroulement des Matchs',
          content:
            "Les matchs doivent être joués à l'heure indiquée. Tout retard supérieur à 15 minutes peut entraîner une disqualification. Les résultats doivent être reportés immédiatement après la fin de la rencontre, accompagnés des preuves nécessaires (captures d'écran).",
        },
        behavior: {
          title: 'Comportement et Fair-play',
          content:
            "Un comportement respectueux est exigé envers les adversaires, les coéquipiers et les administrateurs. Tout propos injurieux, discriminatoire ou toxique sera sanctionné, pouvant aller jusqu'au bannissement définitif.",
        },
        infractions: {
          title: 'Infractions et Sanctions',
          content:
            "Les administrateurs se réservent le droit d'appliquer des sanctions en cas de triche, d'exploitation de bugs, ou de tout autre comportement nuisant à l'intégrité de la compétition.",
        },
        rewards: {
          title: 'Récompenses',
          content:
            'Les récompenses (cashprize) sont versées dans un délai de 30 jours après la validation des résultats finaux. Les gagnants doivent fournir les informations nécessaires pour le paiement.',
        },
      },
    },
  },
  components: {
    twitchEmbed: {
      loading: 'Chargement du stream...',
      offlineTitle: 'Le stream est actuellement offline',
      offlineDescSuffix:
        ' ne stream pas actuellement. Revenez plus tard ou suivez sa chaîne sur Twitch.',
    },
    tournamentsList: {
      sectionTitle: 'Tournois à venir',
      viewAll: 'Tout voir',
      emptyTitle: 'Aucun tournoi prévu',
      emptyDesc: 'Revenez plus tard pour les prochaines annonces !',
      labelOpen: 'Inscriptions ouvertes',
      labelDetails: 'Voir les détails',
    },
    tournamentCard: {
      btnDetails: 'Voir les détails',
      format: {
        team: 'Équipes',
        player: 'Joueurs',
      },
      prefixId: 'ID:',
      prefixRegistered: 'Inscrit',
    },
    challongeIdForm: {
      placeholderId: 'ex: belouga_cup_1',
      btnSave: "Enregistrer l'ID",
      btnSaving: 'Enregistrement...',
    },
  },
} as const
