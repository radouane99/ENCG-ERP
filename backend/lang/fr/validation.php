<?php

return [
    'required' => 'Le champ :attribute est obligatoire.',
    'email' => 'Le champ :attribute doit être une adresse email valide.',
    'min' => [
        'string' => 'Le champ :attribute doit contenir au moins :min caractères.',
    ],
    'max' => [
        'string' => 'Le champ :attribute ne doit pas contenir plus de :max caractères.',
    ],
    'unique' => 'La valeur du champ :attribute est déjà utilisée.',
    'in' => 'La valeur sélectionnée pour :attribute est invalide.',

    'attributes' => [
        'first_name' => 'prénom',
        'last_name' => 'nom',
        'email' => 'adresse email',
        'password' => 'mot de passe',
        'cin' => 'CIN',
        'cne' => 'CNE',
        'massar_code' => 'code MASSAR',
        'gender' => 'genre',
        'status' => 'statut',
        'birth_date' => 'date de naissance',
    ],
];
