Feature: Admin user management

  Background:
    Given I am logged in as an admin

  Scenario: Admin panel loads and lists users
    Given I open the admin panel
    Then I see the heading "Admin panel"
    And I see a list of users
