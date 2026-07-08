<?php

it('has professor page', function () {
    $response = $this->get('/professor');

    $response->assertStatus(200);
});
