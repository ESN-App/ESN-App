using FluentValidation;

namespace EsnApp.Application.News.CreateNewsItem;

public class CreateNewsItemCommandValidator : AbstractValidator<CreateNewsItemCommand>
{
    public CreateNewsItemCommandValidator()
    {
        RuleFor(command => command.Title).NotEmpty().MaximumLength(200);
        RuleFor(command => command.Description).NotEmpty().MaximumLength(2000);
        RuleFor(command => command.ImagePath).NotEmpty().MaximumLength(2000);
    }
}
