<?php

it('has student page', function () {
    $response = $this->get('/student');

    $response->assertStatus(200);
});
