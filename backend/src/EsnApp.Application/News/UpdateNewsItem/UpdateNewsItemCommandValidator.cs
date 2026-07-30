using FluentValidation;

namespace EsnApp.Application.News.UpdateNewsItem;

public class UpdateNewsItemCommandValidator : AbstractValidator<UpdateNewsItemCommand>
{
    public UpdateNewsItemCommandValidator()
    {
        RuleFor(command => command.Id).NotEmpty();
        RuleFor(command => command.Title).NotEmpty().MaximumLength(200);
        RuleFor(command => command.Description).NotEmpty().MaximumLength(2000);
        RuleFor(command => command.ImagePath).NotEmpty().MaximumLength(2000);
    }
}
